<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\Transaction;
use App\Models\Budget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $today = now()->startOfDay();
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();
        $startOfLastMonth = now()->subMonth()->startOfMonth();
        $endOfLastMonth = now()->subMonth()->endOfMonth();

        // ==========================================
        // MÉTRICAS DE PACIENTES
        // ==========================================
        $patientsTotal = Patient::where('status', 'active')->count();
        $patientsNewMonth = Patient::where('created_at', '>=', $startOfMonth)->count();
        $patientsNewLastMonth = Patient::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();
        
        // ==========================================
        // MÉTRICAS DE AGENDAMENTOS
        // ==========================================
        $appointmentsToday = Appointment::whereDate('start_time', $today)
            ->whereNotIn('status', ['cancelled'])
            ->count();
            
        $appointmentsPending = Appointment::whereDate('start_time', $today)
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->count();

        $appointmentsMonth = Appointment::whereBetween('start_time', [$startOfMonth, $endOfMonth])
            ->whereNotIn('status', ['cancelled'])
            ->count();

        $completedMonth = Appointment::whereBetween('start_time', [$startOfMonth, $endOfMonth])
            ->where('status', 'completed')
            ->count();

        $noShowsMonth = Appointment::whereBetween('start_time', [$startOfMonth, $endOfMonth])
            ->where('status', 'no_show')
            ->count();

        $noShowRate = $appointmentsMonth > 0 
            ? round(($noShowsMonth / $appointmentsMonth) * 100, 1) 
            : 0;

        // ==========================================
        // MÉTRICAS FINANCEIRAS
        // ==========================================
        $revenueMonth = Transaction::whereBetween('paid_at', [$startOfMonth, $endOfMonth])
            ->where('type', 'income')
            ->where('status', 'paid')
            ->sum('amount');

        $revenueLastMonth = Transaction::whereBetween('paid_at', [$startOfLastMonth, $endOfLastMonth])
            ->where('type', 'income')
            ->where('status', 'paid')
            ->sum('amount');

        $revenueGrowth = $revenueLastMonth > 0 
            ? round((($revenueMonth - $revenueLastMonth) / $revenueLastMonth) * 100, 1)
            : 0;

        $pendingPayments = Transaction::where('type', 'income')
            ->where('status', 'pending')
            ->sum('amount');

        $overduePayments = Transaction::where('type', 'income')
            ->where('status', 'pending')
            ->where('due_date', '<', now())
            ->sum('amount');

        // ==========================================
        // AGENDAMENTOS DE HOJE
        // ==========================================
        $todayAppointments = Appointment::with('patient:id,name,phone,attendance_score')
            ->whereDate('start_time', $today)
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('start_time')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'time' => $a->start_time->format('H:i'),
                'end_time' => $a->end_time->format('H:i'),
                'patient_id' => $a->patient_id,
                'patient_name' => $a->patient?->name ?? 'Horário bloqueado',
                'patient_phone' => $a->patient?->phone,
                'type' => $a->type,
                'status' => $a->status,
                'risk_score' => $a->patient?->attendance_score < 0.7 ? 'high' : 'low',
            ]);

        // ==========================================
        // GRÁFICO DE RECEITA (últimos 30 dias)
        // ==========================================
        $revenueChart = Transaction::where('type', 'income')
            ->where('status', 'paid')
            ->where('paid_at', '>=', now()->subDays(30))
            ->groupBy(DB::raw('DATE(paid_at)'))
            ->select(DB::raw('DATE(paid_at) as date'), DB::raw('SUM(amount) as total'))
            ->orderBy('date')
            ->get();

        // ==========================================
        // GRÁFICO DE AGENDAMENTOS (últimos 7 dias)
        // ==========================================
        $appointmentsChart = Appointment::where('start_time', '>=', now()->subDays(7))
            ->whereNotIn('status', ['cancelled'])
            ->groupBy(DB::raw('DATE(start_time)'))
            ->select(
                DB::raw('DATE(start_time) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN status = "no_show" THEN 1 ELSE 0 END) as no_show')
            )
            ->orderBy('date')
            ->get();

        // ==========================================
        // TOP PROCEDIMENTOS DO MÊS
        // ==========================================
        $topProcedures = Transaction::whereBetween('paid_at', [$startOfMonth, $endOfMonth])
            ->where('type', 'income')
            ->where('status', 'paid')
            ->whereNotNull('procedure_type')
            ->groupBy('procedure_type')
            ->select('procedure_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as revenue'))
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        // ==========================================
        // ALERTAS
        // ==========================================
        $alerts = [];

        // Pacientes em risco de churn
        $churnRiskCount = Patient::where('status', 'active')
            ->where(function($q) {
                $q->whereNull('last_visit_at')
                  ->orWhere('last_visit_at', '<', now()->subDays(90));
            })
            ->count();

        if ($churnRiskCount > 0) {
            $alerts[] = [
                'type' => 'warning',
                'title' => "$churnRiskCount pacientes em risco de churn",
                'message' => 'Pacientes sem consulta há mais de 90 dias',
                'action' => '/patients?filter=inactive',
            ];
        }

        // Pagamentos em atraso
        $overdueCount = Transaction::where('type', 'income')
            ->where('status', 'pending')
            ->where('due_date', '<', now())
            ->count();

        if ($overdueCount > 0) {
            $alerts[] = [
                'type' => 'danger',
                'title' => "$overdueCount pagamentos em atraso",
                'message' => "Total: R$ " . number_format($overduePayments, 2, ',', '.'),
                'action' => '/financial/transactions?status=overdue',
            ];
        }

        // Orçamentos pendentes
        $pendingBudgets = Budget::where('status', 'pending')
            ->where('valid_until', '>', now())
            ->count();

        if ($pendingBudgets > 0) {
            $alerts[] = [
                'type' => 'info',
                'title' => "$pendingBudgets orçamentos aguardando aprovação",
                'message' => 'Faça follow-up com os pacientes',
                'action' => '/financial/budgets?status=pending',
            ];
        }

        // Aniversariantes da semana
        $birthdaysCount = Patient::where('status', 'active')
            ->whereRaw("strftime('%m-%d', birth_date) BETWEEN ? AND ?", [
                now()->startOfWeek()->format('m-d'),
                now()->endOfWeek()->format('m-d'),
            ])
            ->count();

        if ($birthdaysCount > 0) {
            $alerts[] = [
                'type' => 'success',
                'title' => "$birthdaysCount aniversariantes esta semana",
                'message' => 'Envie mensagens de parabéns',
                'action' => '/patients?filter=birthdays',
            ];
        }

        return response()->json([
            'data' => [
                'stats' => [
                    'patients' => [
                        'total' => $patientsTotal,
                        'new_month' => $patientsNewMonth,
                        'growth' => $patientsNewLastMonth > 0 
                            ? round((($patientsNewMonth - $patientsNewLastMonth) / $patientsNewLastMonth) * 100, 1)
                            : 0,
                    ],
                    'appointments' => [
                        'today' => $appointmentsToday,
                        'pending' => $appointmentsPending,
                        'month' => $appointmentsMonth,
                        'completed_month' => $completedMonth,
                        'no_show_rate' => $noShowRate,
                    ],
                    'financial' => [
                        'revenue_month' => (float) $revenueMonth,
                        'revenue_growth' => $revenueGrowth,
                        'pending' => (float) $pendingPayments,
                        'overdue' => (float) $overduePayments,
                    ],
                ],
                'appointments_today' => $todayAppointments,
                'charts' => [
                    'revenue' => $revenueChart,
                    'appointments' => $appointmentsChart,
                    'top_procedures' => $topProcedures,
                ],
                'alerts' => $alerts,
            ],
        ]);
    }
}
