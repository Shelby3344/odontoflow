<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'professional_id' => 'nullable|uuid',
        ]);

        $query = Appointment::with('patient')
            ->whereBetween('start_time', [
                $request->start_date,
                $request->end_date . ' 23:59:59',
            ]);

        if ($request->professional_id) {
            $query->where('professional_id', $request->professional_id);
        }

        $appointments = $query->orderBy('start_time')->get();

        return response()->json([
            'data' => $appointments->map(fn($a) => [
                'id' => $a->id,
                'patient_id' => $a->patient_id,
                'patient_name' => $a->patient?->name ?? 'Bloqueio',
                'professional_id' => $a->professional_id,
                'start_time' => $a->start_time->toIso8601String(),
                'end_time' => $a->end_time->toIso8601String(),
                'duration' => $a->duration,
                'type' => $a->type,
                'status' => $a->status,
                'notes' => $a->notes,
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'professional_id' => 'required|uuid|exists:users,id',
            'start_time' => 'required|date',
            'duration' => 'required|integer|min:15|max:480',
            'type' => 'nullable|string',
            'notes' => 'nullable|string|max:500',
        ]);

        $startTime = \Carbon\Carbon::parse($validated['start_time']);
        $endTime = $startTime->copy()->addMinutes($validated['duration']);

        $appointment = Appointment::create([
            ...$validated,
            'end_time' => $endTime,
            'status' => 'scheduled',
        ]);

        return response()->json([
            'data' => $appointment,
            'message' => 'Agendamento criado com sucesso',
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $appointment = Appointment::with('patient', 'professional')->findOrFail($id);

        return response()->json([
            'data' => $appointment,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'start_time' => 'nullable|date',
            'duration' => 'nullable|integer|min:15|max:480',
            'status' => 'nullable|string',
            'notes' => 'nullable|string|max:500',
        ]);

        if (isset($validated['start_time']) && isset($validated['duration'])) {
            $startTime = \Carbon\Carbon::parse($validated['start_time']);
            $validated['end_time'] = $startTime->copy()->addMinutes($validated['duration']);
        }

        $appointment->update($validated);

        return response()->json([
            'data' => $appointment,
            'message' => 'Agendamento atualizado com sucesso',
        ]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $appointment->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancelled_reason' => $request->reason,
        ]);

        return response()->json([
            'message' => 'Agendamento cancelado com sucesso',
        ]);
    }

    public function confirm(Request $request, string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $appointment->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
            'confirmed_via' => $request->via ?? 'app',
        ]);

        return response()->json([
            'message' => 'Agendamento confirmado com sucesso',
        ]);
    }

    public function checkIn(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update(['status' => 'waiting']);

        return response()->json([
            'message' => 'Check-in realizado com sucesso',
        ]);
    }

    public function startService(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update(['status' => 'in_progress']);

        return response()->json([
            'message' => 'Atendimento iniciado',
        ]);
    }

    public function completeService(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update(['status' => 'completed']);

        // Atualizar última visita do paciente
        if ($appointment->patient_id) {
            $appointment->patient->update(['last_visit_at' => now()]);
        }

        return response()->json([
            'message' => 'Atendimento finalizado',
        ]);
    }

    public function noShow(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update(['status' => 'no_show']);

        return response()->json([
            'message' => 'Marcado como não compareceu',
        ]);
    }

    public function availableSlots(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date',
            'professional_id' => 'required|uuid',
            'duration' => 'nullable|integer|min:15',
        ]);

        $date = \Carbon\Carbon::parse($request->date);
        $duration = $request->duration ?? 30;
        $professionalId = $request->professional_id;

        // Buscar agendamentos existentes
        $existingAppointments = Appointment::where('professional_id', $professionalId)
            ->whereDate('start_time', $date)
            ->whereNotIn('status', ['cancelled'])
            ->get(['start_time', 'end_time']);

        // Buscar bloqueios
        $blocks = \App\Models\ScheduleBlock::where('professional_id', $professionalId)
            ->whereDate('start_time', $date)
            ->get(['start_time', 'end_time']);

        // Gerar slots disponíveis (8h às 18h)
        $slots = [];
        $startHour = 8;
        $endHour = 18;

        for ($hour = $startHour; $hour < $endHour; $hour++) {
            foreach ([0, 30] as $minute) {
                $slotStart = $date->copy()->setHour($hour)->setMinute($minute)->setSecond(0);
                $slotEnd = $slotStart->copy()->addMinutes($duration);

                // Verificar se slot está disponível
                $isAvailable = true;

                foreach ($existingAppointments as $apt) {
                    if ($slotStart < $apt->end_time && $slotEnd > $apt->start_time) {
                        $isAvailable = false;
                        break;
                    }
                }

                foreach ($blocks as $block) {
                    if ($slotStart < $block->end_time && $slotEnd > $block->start_time) {
                        $isAvailable = false;
                        break;
                    }
                }

                if ($isAvailable && $slotEnd->hour <= $endHour) {
                    $slots[] = [
                        'time' => $slotStart->format('H:i'),
                        'datetime' => $slotStart->toIso8601String(),
                    ];
                }
            }
        }

        return response()->json(['data' => $slots]);
    }

    /**
     * Sugestões inteligentes de horários baseadas em IA
     */
    public function smartSuggestions(Request $request): JsonResponse
    {
        $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'professional_id' => 'required|uuid',
            'duration' => 'nullable|integer|min:15',
            'preferred_period' => 'nullable|in:morning,afternoon,any',
        ]);

        $patient = \App\Models\Patient::findOrFail($request->patient_id);
        $preferredPeriod = $request->preferred_period ?? $patient->preferred_schedule_time ?? 'any';
        
        // Analisar histórico do paciente
        $patientHistory = Appointment::where('patient_id', $patient->id)
            ->whereIn('status', ['completed', 'no_show', 'cancelled'])
            ->orderBy('start_time', 'desc')
            ->limit(10)
            ->get();

        // Calcular melhor horário baseado em comparecimentos
        $bestHours = $this->analyzeBestHours($patientHistory);
        
        // Calcular risco de no-show
        $noShowRisk = $this->calculatePatientNoShowRisk($patient, $patientHistory);

        // Buscar próximos 7 dias com slots disponíveis
        $suggestions = [];
        $today = now()->startOfDay();

        for ($i = 1; $i <= 7; $i++) {
            $date = $today->copy()->addDays($i);
            
            // Pular fins de semana
            if ($date->isWeekend()) continue;

            $availableSlots = $this->getAvailableSlotsForDate(
                $date,
                $request->professional_id,
                $request->duration ?? 30
            );

            foreach ($availableSlots as $slot) {
                $hour = (int) substr($slot['time'], 0, 2);
                $period = $hour < 12 ? 'morning' : 'afternoon';

                // Filtrar por período preferido
                if ($preferredPeriod !== 'any' && $period !== $preferredPeriod) {
                    continue;
                }

                // Calcular score do slot
                $score = $this->calculateSlotScore($hour, $bestHours, $date->dayOfWeek);

                $suggestions[] = [
                    'date' => $date->format('Y-m-d'),
                    'time' => $slot['time'],
                    'datetime' => $slot['datetime'],
                    'score' => $score,
                    'period' => $period,
                    'day_name' => $date->locale('pt_BR')->dayName,
                ];
            }
        }

        // Ordenar por score e limitar
        usort($suggestions, fn($a, $b) => $b['score'] <=> $a['score']);
        $suggestions = array_slice($suggestions, 0, 5);

        return response()->json([
            'data' => [
                'suggestions' => $suggestions,
                'patient_analysis' => [
                    'no_show_risk' => $noShowRisk,
                    'risk_level' => $noShowRisk > 0.5 ? 'high' : ($noShowRisk > 0.3 ? 'medium' : 'low'),
                    'preferred_period' => $preferredPeriod,
                    'best_hours' => $bestHours,
                ],
                'recommendations' => $this->getSchedulingRecommendations($noShowRisk, $patient),
            ],
        ]);
    }

    /**
     * Bloqueios de agenda
     */
    public function blocks(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'professional_id' => 'nullable|uuid',
        ]);

        $query = \App\Models\ScheduleBlock::whereBetween('start_time', [
            $request->start_date,
            $request->end_date . ' 23:59:59',
        ]);

        if ($request->professional_id) {
            $query->where('professional_id', $request->professional_id);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function createBlock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professional_id' => 'required|uuid|exists:users,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'type' => 'required|in:lunch,vacation,meeting,personal,other',
            'title' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
            'is_recurring' => 'nullable|boolean',
            'recurrence_rule' => 'nullable|string',
        ]);

        $block = \App\Models\ScheduleBlock::create($validated);

        return response()->json([
            'data' => $block,
            'message' => 'Bloqueio criado com sucesso',
        ], 201);
    }

    public function deleteBlock(string $id): JsonResponse
    {
        $block = \App\Models\ScheduleBlock::findOrFail($id);
        $block->delete();

        return response()->json(['message' => 'Bloqueio removido com sucesso']);
    }

    // ==========================================
    // MÉTODOS PRIVADOS - AGENDA PREDITIVA
    // ==========================================

    private function analyzeBestHours($history): array
    {
        $hourCounts = [];
        
        foreach ($history as $apt) {
            if ($apt->status === 'completed') {
                $hour = $apt->start_time->hour;
                $hourCounts[$hour] = ($hourCounts[$hour] ?? 0) + 1;
            }
        }

        arsort($hourCounts);
        return array_slice(array_keys($hourCounts), 0, 3);
    }

    private function calculatePatientNoShowRisk($patient, $history): float
    {
        if ($history->isEmpty()) {
            return 0.2; // Risco padrão para novos pacientes
        }

        $noShows = $history->where('status', 'no_show')->count();
        $total = $history->count();

        return $total > 0 ? $noShows / $total : 0.2;
    }

    private function getAvailableSlotsForDate($date, $professionalId, $duration): array
    {
        $existingAppointments = Appointment::where('professional_id', $professionalId)
            ->whereDate('start_time', $date)
            ->whereNotIn('status', ['cancelled'])
            ->get(['start_time', 'end_time']);

        $slots = [];
        for ($hour = 8; $hour < 18; $hour++) {
            foreach ([0, 30] as $minute) {
                $slotStart = $date->copy()->setHour($hour)->setMinute($minute);
                $slotEnd = $slotStart->copy()->addMinutes($duration);

                $isAvailable = true;
                foreach ($existingAppointments as $apt) {
                    if ($slotStart < $apt->end_time && $slotEnd > $apt->start_time) {
                        $isAvailable = false;
                        break;
                    }
                }

                if ($isAvailable) {
                    $slots[] = [
                        'time' => $slotStart->format('H:i'),
                        'datetime' => $slotStart->toIso8601String(),
                    ];
                }
            }
        }

        return $slots;
    }

    private function calculateSlotScore($hour, $bestHours, $dayOfWeek): float
    {
        $score = 50.0;

        // Bonus para horários preferidos do paciente
        if (in_array($hour, $bestHours)) {
            $score += 30;
        }

        // Horários de pico (10h-12h, 14h-16h) têm score maior
        if (($hour >= 10 && $hour <= 12) || ($hour >= 14 && $hour <= 16)) {
            $score += 10;
        }

        // Segunda-feira tem mais faltas
        if ($dayOfWeek === 1) {
            $score -= 10;
        }

        return min(100, max(0, $score));
    }

    private function getSchedulingRecommendations($noShowRisk, $patient): array
    {
        $recommendations = [];

        if ($noShowRisk > 0.5) {
            $recommendations[] = 'Paciente com alto risco de falta. Considerar confirmação por telefone.';
            $recommendations[] = 'Sugerido overbooking neste horário.';
        }

        if (!$patient->whatsapp) {
            $recommendations[] = 'Cadastrar WhatsApp para envio de lembretes automáticos.';
        }

        if ($patient->preferred_schedule_time) {
            $recommendations[] = "Paciente prefere horários no período da {$patient->preferred_schedule_time}.";
        }

        return $recommendations;
    }
}
