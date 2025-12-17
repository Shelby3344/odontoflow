<?php

declare(strict_types=1);

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Schedule\Services\ScheduleService;
use App\Application\Schedule\DTOs\CreateAppointmentDTO;
use App\Application\Schedule\DTOs\UpdateAppointmentDTO;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ScheduleController
{
    public function __construct(
        private readonly ScheduleService $scheduleService,
    ) {}

    /**
     * Lista agenda do profissional
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professional_id' => 'nullable|uuid',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'nullable|string',
        ]);

        $appointments = $this->scheduleService->getAppointments(
            professionalId: $validated['professional_id'] ?? $request->user()->id,
            startDate: new \DateTimeImmutable($validated['start_date']),
            endDate: new \DateTimeImmutable($validated['end_date']),
            status: $validated['status'] ?? null,
        );

        return response()->json([
            'data' => $appointments,
        ]);
    }

    /**
     * Cria novo agendamento
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid',
            'professional_id' => 'required|uuid',
            'start_time' => 'required|date',
            'duration' => 'required|integer|min:15|max:480',
            'type' => 'nullable|string',
            'procedure_type_id' => 'nullable|uuid',
            'notes' => 'nullable|string|max:500',
        ]);

        $dto = CreateAppointmentDTO::fromRequest($validated);
        $appointment = $this->scheduleService->createAppointment($dto);

        return response()->json([
            'data' => $appointment,
            'message' => 'Agendamento criado com sucesso',
        ], 201);
    }

    /**
     * Exibe detalhes do agendamento
     */
    public function show(string $id): JsonResponse
    {
        $appointment = $this->scheduleService->findAppointment($id);

        if (!$appointment) {
            return response()->json([
                'error' => 'Agendamento não encontrado',
            ], 404);
        }

        return response()->json([
            'data' => $appointment,
        ]);
    }

    /**
     * Atualiza agendamento
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'start_time' => 'nullable|date',
            'duration' => 'nullable|integer|min:15|max:480',
            'status' => 'nullable|string',
            'notes' => 'nullable|string|max:500',
        ]);

        $dto = UpdateAppointmentDTO::fromRequest($validated);
        $appointment = $this->scheduleService->updateAppointment($id, $dto);

        return response()->json([
            'data' => $appointment,
            'message' => 'Agendamento atualizado com sucesso',
        ]);
    }

    /**
     * Cancela agendamento
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $this->scheduleService->cancelAppointment(
            $id,
            $validated['reason'] ?? null
        );

        return response()->json([
            'message' => 'Agendamento cancelado com sucesso',
        ]);
    }

    /**
     * Confirma agendamento
     */
    public function confirm(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'via' => 'nullable|string|in:whatsapp,sms,email,phone,app',
        ]);

        $this->scheduleService->confirmAppointment(
            $id,
            $validated['via'] ?? 'app'
        );

        return response()->json([
            'message' => 'Agendamento confirmado com sucesso',
        ]);
    }

    /**
     * Marca chegada do paciente
     */
    public function checkIn(string $id): JsonResponse
    {
        $this->scheduleService->checkInPatient($id);

        return response()->json([
            'message' => 'Check-in realizado com sucesso',
        ]);
    }

    /**
     * Inicia atendimento
     */
    public function startService(string $id): JsonResponse
    {
        $this->scheduleService->startService($id);

        return response()->json([
            'message' => 'Atendimento iniciado',
        ]);
    }

    /**
     * Finaliza atendimento
     */
    public function completeService(string $id): JsonResponse
    {
        $this->scheduleService->completeService($id);

        return response()->json([
            'message' => 'Atendimento finalizado',
        ]);
    }

    /**
     * Marca como não compareceu
     */
    public function noShow(string $id): JsonResponse
    {
        $this->scheduleService->markNoShow($id);

        return response()->json([
            'message' => 'Marcado como não compareceu',
        ]);
    }

    /**
     * Busca horários disponíveis
     */
    public function availableSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professional_id' => 'required|uuid',
            'date' => 'required|date',
            'duration' => 'required|integer|min:15|max:480',
        ]);

        $slots = $this->scheduleService->getAvailableSlots(
            professionalId: $validated['professional_id'],
            date: new \DateTimeImmutable($validated['date']),
            duration: (int) $validated['duration'],
        );

        return response()->json([
            'data' => $slots,
        ]);
    }

    /**
     * Sugestões inteligentes de horário
     */
    public function smartSuggestions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid',
            'professional_id' => 'required|uuid',
            'procedure_type_id' => 'nullable|uuid',
            'preferred_period' => 'nullable|string|in:morning,afternoon,evening',
        ]);

        $suggestions = $this->scheduleService->getSmartSuggestions(
            patientId: $validated['patient_id'],
            professionalId: $validated['professional_id'],
            procedureTypeId: $validated['procedure_type_id'] ?? null,
            preferredPeriod: $validated['preferred_period'] ?? null,
        );

        return response()->json([
            'data' => $suggestions,
        ]);
    }

    /**
     * Bloqueios de agenda
     */
    public function blocks(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professional_id' => 'required|uuid',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $blocks = $this->scheduleService->getBlocks(
            professionalId: $validated['professional_id'],
            startDate: new \DateTimeImmutable($validated['start_date']),
            endDate: new \DateTimeImmutable($validated['end_date']),
        );

        return response()->json([
            'data' => $blocks,
        ]);
    }

    /**
     * Cria bloqueio de agenda
     */
    public function createBlock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professional_id' => 'required|uuid',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'type' => 'required|string|in:lunch,vacation,meeting,personal',
            'title' => 'nullable|string|max:255',
            'is_recurring' => 'nullable|boolean',
            'recurrence_rule' => 'nullable|string',
        ]);

        $block = $this->scheduleService->createBlock($validated);

        return response()->json([
            'data' => $block,
            'message' => 'Bloqueio criado com sucesso',
        ], 201);
    }

    /**
     * Remove bloqueio
     */
    public function deleteBlock(string $id): JsonResponse
    {
        $this->scheduleService->deleteBlock($id);

        return response()->json([
            'message' => 'Bloqueio removido com sucesso',
        ]);
    }
}
