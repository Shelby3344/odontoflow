<?php

declare(strict_types=1);

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Domain\AI\Services\AIServiceInterface;
use App\Domain\AI\DTOs\AIRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AIController
{
    public function __construct(
        private readonly AIServiceInterface $aiService,
    ) {}

    /**
     * Gera evolução clínica com IA
     */
    public function generateEvolution(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid',
            'appointment_id' => 'nullable|uuid',
            'procedures' => 'required|array',
            'procedures.*.id' => 'required|uuid',
            'procedures.*.name' => 'required|string',
            'additional_notes' => 'nullable|string',
        ]);

        $aiRequest = AIRequest::forClinicalEvolution(
            userId: $request->user()->id,
            patientId: $validated['patient_id'],
            patientData: [], // Será enriquecido pelo ContextBuilder
            appointmentData: ['id' => $validated['appointment_id'] ?? null],
            procedures: $validated['procedures'],
            additionalNotes: $validated['additional_notes'] ?? null,
        );

        $response = $this->aiService->generateClinicalEvolution($aiRequest);

        return response()->json($response->toArray());
    }

    /**
     * Sugere diagnósticos
     */
    public function suggestDiagnosis(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid',
            'symptoms' => 'required|array',
            'clinical_exam' => 'required|array',
        ]);

        $aiRequest = AIRequest::forDiagnosis(
            userId: $request->user()->id,
            patientId: $validated['patient_id'],
            patientData: [],
            symptoms: $validated['symptoms'],
            clinicalExam: $validated['clinical_exam'],
            history: [],
        );

        $response = $this->aiService->suggestDiagnosis($aiRequest);

        return response()->json($response->toArray());
    }

    /**
     * Sugere plano de tratamento
     */
    public function suggestTreatment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid',
            'diagnosis' => 'required|array',
            'preferences' => 'nullable|array',
        ]);

        $aiRequest = AIRequest::forTreatmentPlan(
            userId: $request->user()->id,
            patientId: $validated['patient_id'],
            patientData: [],
            diagnosis: $validated['diagnosis'],
            odontogram: [],
            preferences: $validated['preferences'] ?? [],
        );

        $response = $this->aiService->suggestTreatmentPlan($aiRequest);

        return response()->json($response->toArray());
    }

    /**
     * Chat com assistente IA
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|uuid',
            'context' => 'nullable|array',
        ]);

        // Buscar histórico da conversa se existir
        $conversationHistory = [];
        if ($validated['conversation_id'] ?? null) {
            // Buscar do cache/banco
            $conversationHistory = cache()->get(
                "conversation:{$validated['conversation_id']}",
                []
            );
        }

        $aiRequest = AIRequest::forChat(
            userId: $request->user()->id,
            message: $validated['message'],
            conversationHistory: $conversationHistory,
            currentContext: $validated['context'] ?? null,
        );

        $response = $this->aiService->chat($aiRequest);

        // Salvar no histórico
        $conversationId = $validated['conversation_id'] ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
        $conversationHistory[] = ['role' => 'user', 'content' => $validated['message']];
        $conversationHistory[] = ['role' => 'assistant', 'content' => $response->content];
        
        cache()->put(
            "conversation:{$conversationId}",
            array_slice($conversationHistory, -20), // Manter últimas 20 mensagens
            now()->addHours(24)
        );

        return response()->json([
            ...$response->toArray(),
            'conversation_id' => $conversationId,
        ]);
    }

    /**
     * Analisa risco de falta
     */
    public function analyzeNoShowRisk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|string',
        ]);

        $aiRequest = AIRequest::forNoShowRisk(
            patientId: $validated['patient_id'],
            patientData: [],
            appointmentHistory: [],
            appointmentData: [
                'date' => $validated['appointment_date'],
                'time' => $validated['appointment_time'],
            ],
        );

        $response = $this->aiService->analyzeNoShowRisk($aiRequest);

        return response()->json($response->toArray());
    }

    /**
     * Gera insights financeiros
     */
    public function financialInsights(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'nullable|string|in:week,month,quarter,year',
        ]);

        $aiRequest = new AIRequest(
            type: 'financial_insights',
            context: [
                'period' => $validated['period'] ?? 'month',
            ],
            userId: $request->user()->id,
        );

        $response = $this->aiService->generateFinancialInsights($aiRequest);

        return response()->json($response->toArray());
    }

    /**
     * Gera mensagem personalizada
     */
    public function generateMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid',
            'message_type' => 'required|string|in:reminder,confirmation,follow_up,birthday,reactivation',
            'context' => 'nullable|array',
        ]);

        $aiRequest = AIRequest::forMessage(
            patientId: $validated['patient_id'],
            patientData: [],
            messageType: $validated['message_type'],
            messageContext: $validated['context'] ?? [],
        );

        $response = $this->aiService->generateMessage($aiRequest);

        return response()->json($response->toArray());
    }

    /**
     * Feedback sobre resposta da IA
     */
    public function feedback(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'interaction_id' => 'required|uuid',
            'was_accepted' => 'required|boolean',
            'was_edited' => 'nullable|boolean',
            'feedback' => 'nullable|string|in:helpful,not_helpful,incorrect',
            'notes' => 'nullable|string|max:500',
        ]);

        // Atualizar registro de interação
        \DB::table('ai_interactions')
            ->where('id', $validated['interaction_id'])
            ->update([
                'was_accepted' => $validated['was_accepted'],
                'was_edited' => $validated['was_edited'] ?? false,
                'user_feedback' => $validated['feedback'],
                'feedback_notes' => $validated['notes'],
            ]);

        return response()->json([
            'message' => 'Feedback registrado com sucesso',
        ]);
    }
}
