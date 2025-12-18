<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Dashboard principal com KPIs
     */
    public function dashboard(Request $request): JsonResponse
    {
        $period = $request->period ?? 'month';
        $startDate = $this->getStartDate($period);
        $endDate = now();
        $previousStart = $this->getPreviousStartDate($period, $startDate);

        // KPIs atuais
        $currentMetrics = $this->calculateMetrics($startDate, $endDate);
        $previousMetrics = $this->calculateMetrics($previousStart, $startDate);

        // Calcular variações
        $variations = [];
        foreach ($currentMetrics as $key => $value) {
            $prev = $previousMetrics[$key] ?? 0;
            $variations[$key] = $prev > 0 ? round((($value - $prev) / $prev) * 100, 1) : 0;
        }

        // Gráfico de agendamentos por dia
        $appointmentsByDay = Appointment::whereBetween('start_time', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled'])
            ->groupBy(DB::raw('DATE(start_time)'))
            ->select(DB::raw('DATE(start_time) as date'), DB::raw('COUNT(*) as count'))
            ->orderBy('date')
            ->get();

        // Gráfico de receita por dia
        $revenueByDay = Transaction::whereBetween('paid_at', [$startDate, $endDate])
            ->where('type', 'income')
            ->where('status', 'paid')
            ->groupBy(DB::raw('DATE(paid_at)'))
            ->select(DB::raw('DATE(paid_at) as date'), DB::raw('SUM(amount) as total'))
            ->orderBy('date')
            ->get();

        // Top procedimentos
        $topProcedures = Transaction::whereBetween('paid_at', [$startDate, $endDate])
            ->where('type', 'income')
            ->where('status', 'paid')
            ->whereNotNull('procedure_type')
            ->groupBy('procedure_type')
            ->select('procedure_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as revenue'))
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        // Pacientes em risco de churn
        $churnRisk = Patient::where('last_visit_at', '<', now()->subMonths(3))
            ->where('status', 'active')
            ->count();

        return response()->json([
            'data' => [
                'metrics' => $currentMetrics,
                'variations' => $variations,
                'charts' => [
                    'appointments_by_day' => $appointmentsByDay,
                    'revenue_by_day' => $revenueByDay,
                    'top_procedures' => $topProcedures,
                ],
                'alerts' => [
                    'churn_risk_patients' => $churnRisk,
                    'overdue_payments' => Transaction::where('status', 'pending')
                        ->where('due_date', '<', now())
                        ->count(),
                    'pending_budgets' => \App\Models\Budget::where('status', 'pending')
                        ->where('valid_until', '>', now())
                        ->count(),
                ],
            ],
        ]);
    }

    /**
     * Relatório de agendamentos
     */
    public function appointments(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $appointments = Appointment::whereBetween('start_time', [$startDate, $endDate])
            ->get();

        // Métricas
        $total = $appointments->count();
        $completed = $appointments->where('status', 'completed')->count();
        $noShows = $appointments->where('status', 'no_show')->count();
        $cancelled = $appointments->where('status', 'cancelled')->count();

        // Taxa de ocupação (considerando 8h de trabalho, 30min por slot)
        $workDays = $this->countWorkDays($startDate, $endDate);
        $totalSlots = $workDays * 16; // 16 slots de 30min por dia
        $occupancyRate = $totalSlots > 0 ? round(($total / $totalSlots) * 100, 1) : 0;

        // Por status
        $byStatus = $appointments->groupBy('status')->map->count();

        // Por profissional
        $byProfessional = $appointments->groupBy('professional_id')
            ->map(function ($apts, $profId) {
                $prof = User::find($profId);
                return [
                    'name' => $prof?->name ?? 'Desconhecido',
                    'total' => $apts->count(),
                    'completed' => $apts->where('status', 'completed')->count(),
                    'no_shows' => $apts->where('status', 'no_show')->count(),
                ];
            });

        // Por dia da semana
        $byDayOfWeek = $appointments->groupBy(function ($apt) {
            return $apt->start_time->dayOfWeek;
        })->map->count();

        // Por horário
        $byHour = $appointments->groupBy(function ($apt) {
            return $apt->start_time->hour;
        })->map->count();

        return response()->json([
            'data' => [
                'summary' => [
                    'total' => $total,
                    'completed' => $completed,
                    'no_shows' => $noShows,
                    'cancelled' => $cancelled,
                    'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
                    'no_show_rate' => $total > 0 ? round(($noShows / $total) * 100, 1) : 0,
                    'occupancy_rate' => $occupancyRate,
                ],
                'by_status' => $byStatus,
                'by_professional' => $byProfessional,
                'by_day_of_week' => $byDayOfWeek,
                'by_hour' => $byHour,
            ],
        ]);
    }

    /**
     * Relatório financeiro
     */
    public function financial(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $transactions = Transaction::whereBetween('due_date', [$startDate, $endDate])->get();

        // Receitas
        $income = $transactions->where('type', 'income');
        $totalIncome = $income->where('status', 'paid')->sum('amount');
        $pendingIncome = $income->where('status', 'pending')->sum('amount');

        // Despesas
        $expenses = $transactions->where('type', 'expense');
        $totalExpenses = $expenses->where('status', 'paid')->sum('amount');

        // Por categoria
        $byCategory = $transactions->where('status', 'paid')
            ->groupBy('category')
            ->map(function ($txs) {
                return [
                    'income' => $txs->where('type', 'income')->sum('amount'),
                    'expense' => $txs->where('type', 'expense')->sum('amount'),
                ];
            });

        // Por método de pagamento
        $byPaymentMethod = $income->where('status', 'paid')
            ->groupBy('payment_method')
            ->map->sum('amount');

        // Ticket médio
        $paidCount = $income->where('status', 'paid')->count();
        $averageTicket = $paidCount > 0 ? $totalIncome / $paidCount : 0;

        // Inadimplência
        $overdue = $income->where('status', 'pending')
            ->filter(fn($t) => $t->due_date < now())
            ->sum('amount');

        return response()->json([
            'data' => [
                'summary' => [
                    'total_income' => $totalIncome,
                    'pending_income' => $pendingIncome,
                    'total_expenses' => $totalExpenses,
                    'profit' => $totalIncome - $totalExpenses,
                    'profit_margin' => $totalIncome > 0 ? round((($totalIncome - $totalExpenses) / $totalIncome) * 100, 1) : 0,
                    'average_ticket' => round($averageTicket, 2),
                    'overdue' => $overdue,
                ],
                'by_category' => $byCategory,
                'by_payment_method' => $byPaymentMethod,
            ],
        ]);
    }

    /**
     * Relatório de pacientes
     */
    public function patients(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        // Novos pacientes
        $newPatients = Patient::whereBetween('created_at', [$startDate, $endDate])->count();

        // Pacientes ativos (com consulta no período)
        $activePatients = Patient::whereHas('appointments', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_time', [$startDate, $endDate])
              ->where('status', 'completed');
        })->count();

        // Pacientes inativos (sem consulta há 90+ dias)
        $inactivePatients = Patient::where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('last_visit_at')
                  ->orWhere('last_visit_at', '<', now()->subDays(90));
            })->count();

        // Por fonte de aquisição
        $bySource = Patient::whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('source')
            ->groupBy('source')
            ->select('source', DB::raw('COUNT(*) as count'))
            ->get();

        // Aniversariantes do mês
        $birthdays = Patient::whereMonth('birth_date', now()->month)
            ->where('status', 'active')
            ->count();

        // Pacientes em risco (baixo score de comparecimento)
        $atRisk = Patient::where('attendance_score', '<', 0.7)
            ->where('status', 'active')
            ->count();

        // Distribuição por gênero
        $byGender = Patient::whereNotNull('gender')
            ->groupBy('gender')
            ->select('gender', DB::raw('COUNT(*) as count'))
            ->get();

        // Distribuição por faixa etária
        $byAge = Patient::whereNotNull('birth_date')
            ->get()
            ->groupBy(function ($p) {
                $birthDate = \Carbon\Carbon::parse($p->birth_date);
                $age = $birthDate->age;
                if ($age < 18) return '0-17';
                if ($age < 30) return '18-29';
                if ($age < 45) return '30-44';
                if ($age < 60) return '45-59';
                return '60+';
            })
            ->map->count();

        return response()->json([
            'data' => [
                'summary' => [
                    'new_patients' => $newPatients,
                    'active_patients' => $activePatients,
                    'inactive_patients' => $inactivePatients,
                    'at_risk' => $atRisk,
                    'birthdays_this_month' => $birthdays,
                ],
                'by_source' => $bySource,
                'by_gender' => $byGender,
                'by_age' => $byAge,
            ],
        ]);
    }

    /**
     * Relatório de procedimentos
     */
    public function procedures(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        // Usar transações como base para procedimentos
        $transactions = Transaction::whereBetween('paid_at', [$startDate, $endDate])
            ->where('type', 'income')
            ->where('status', 'paid')
            ->whereNotNull('procedure_type')
            ->get();

        // Por tipo de procedimento
        $byType = $transactions->groupBy('procedure_type')
            ->map(function ($txs, $type) {
                return [
                    'name' => $type,
                    'count' => $txs->count(),
                    'revenue' => $txs->sum('amount'),
                ];
            })
            ->sortByDesc('revenue')
            ->values();

        // Por profissional
        $byProfessional = $transactions->groupBy('professional_id')
            ->map(function ($txs, $profId) {
                $prof = User::find($profId);
                return [
                    'name' => $prof?->name ?? 'Desconhecido',
                    'count' => $txs->count(),
                    'revenue' => $txs->sum('amount'),
                ];
            })
            ->sortByDesc('revenue')
            ->values();

        return response()->json([
            'data' => [
                'total' => $transactions->count(),
                'total_revenue' => $transactions->sum('amount'),
                'by_type' => $byType,
                'by_professional' => $byProfessional,
            ],
        ]);
    }

    /**
     * Relatório de profissionais
     */
    public function professionals(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $professionals = User::where('role', 'dentist')
            ->where('is_active', true)
            ->get()
            ->map(function ($prof) use ($startDate, $endDate) {
                $appointments = Appointment::where('professional_id', $prof->id)
                    ->whereBetween('start_time', [$startDate, $endDate])
                    ->get();

                $revenue = Transaction::where('professional_id', $prof->id)
                    ->whereBetween('paid_at', [$startDate, $endDate])
                    ->where('status', 'paid')
                    ->sum('amount');

                return [
                    'id' => $prof->id,
                    'name' => $prof->name,
                    'specialty' => $prof->specialty,
                    'appointments' => [
                        'total' => $appointments->count(),
                        'completed' => $appointments->where('status', 'completed')->count(),
                        'no_shows' => $appointments->where('status', 'no_show')->count(),
                    ],
                    'revenue' => $revenue,
                    'average_per_appointment' => $appointments->where('status', 'completed')->count() > 0
                        ? round($revenue / $appointments->where('status', 'completed')->count(), 2)
                        : 0,
                ];
            });

        return response()->json(['data' => $professionals]);
    }

    /**
     * Exportar relatório
     */
    public function export(Request $request, string $type): JsonResponse
    {
        // Em produção, gerar PDF ou Excel
        // Por enquanto, retornar dados para download

        $data = match ($type) {
            'appointments' => $this->appointments($request)->getData(),
            'financial' => $this->financial($request)->getData(),
            'patients' => $this->patients($request)->getData(),
            default => null,
        };

        if (!$data) {
            return response()->json(['message' => 'Tipo de relatório inválido'], 400);
        }

        return response()->json([
            'data' => $data,
            'export_url' => null, // URL do arquivo gerado
            'message' => 'Relatório gerado com sucesso',
        ]);
    }

    // ==========================================
    // MÉTODOS PRIVADOS
    // ==========================================

    private function getStartDate(string $period): \Carbon\Carbon
    {
        return match ($period) {
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'quarter' => now()->startOfQuarter(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };
    }

    private function getPreviousStartDate(string $period, $currentStart): \Carbon\Carbon
    {
        return match ($period) {
            'week' => $currentStart->copy()->subWeek(),
            'month' => $currentStart->copy()->subMonth(),
            'quarter' => $currentStart->copy()->subQuarter(),
            'year' => $currentStart->copy()->subYear(),
            default => $currentStart->copy()->subMonth(),
        };
    }

    private function calculateMetrics($startDate, $endDate): array
    {
        return [
            'appointments' => Appointment::whereBetween('start_time', [$startDate, $endDate])
                ->whereNotIn('status', ['cancelled'])
                ->count(),
            'completed' => Appointment::whereBetween('start_time', [$startDate, $endDate])
                ->where('status', 'completed')
                ->count(),
            'revenue' => Transaction::whereBetween('paid_at', [$startDate, $endDate])
                ->where('type', 'income')
                ->where('status', 'paid')
                ->sum('amount'),
            'new_patients' => Patient::whereBetween('created_at', [$startDate, $endDate])
                ->count(),
        ];
    }

    private function countWorkDays($startDate, $endDate): int
    {
        $count = 0;
        $current = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);

        while ($current <= $end) {
            if (!$current->isWeekend()) {
                $count++;
            }
            $current->addDay();
        }

        return $count;
    }
}
