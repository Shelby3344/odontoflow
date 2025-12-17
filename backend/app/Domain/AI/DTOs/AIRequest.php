<?php

declare(strict_types=1);

namespace App\Domain\AI\DTOs;

final readonly class AIRequest
{
    public function __construct(
        public string $type,
        public array $context,
        public ?string $userMessage = null,
        public ?string $userId = null,
        public ?string $patientId = null,
        public array $options = [],
    ) {}

    public static function forClinicalEvolution(
        string $userId,
        string $patientId,
        array $patientData,
        array $appointmentData,
        array $procedures,
        ?string $additionalNotes = null,
    ): self {
        return new self(
            type: 'clinical_evolution',
            context: [
                'patient' => $patientData,
                'appointment' => $appointmentData,
                'procedures' => $procedures,
                'additional_notes' => $additionalNotes,
            ],
            userId: $userId,
            patientId: $patientId,
        );
    }

    public static function forDiagnosis(
        string $userId,
        string $patientId,
        array $patientData,
        array $symptoms,
        array $clinicalExam,
        array $history,
    ): self {
        return new self(
            type: 'diagnosis_suggestion',
            context: [
                'patient' => $patientData,
                'symptoms' => $symptoms,
                'clinical_exam' => $clinicalExam,
                'history' => $history,
            ],
            userId: $userId,
            patientId: $patientId,
        );
    }

    public static function forTreatmentPlan(
        string $userId,
        string $patientId,
        array $patientData,
        array $diagnosis,
        array $odontogram,
        array $preferences,
    ): self {
        return new self(
            type: 'treatment_plan',
            context: [
                'patient' => $patientData,
                'diagnosis' => $diagnosis,
                'odontogram' => $odontogram,
                'preferences' => $preferences,
            ],
            userId: $userId,
            patientId: $patientId,
        );
    }

    public static function forNoShowRisk(
        string $patientId,
        array $patientData,
        array $appointmentHistory,
        array $appointmentData,
    ): self {
        return new self(
            type: 'no_show_risk',
            context: [
                'patient' => $patientData,
                'history' => $appointmentHistory,
                'appointment' => $appointmentData,
            ],
            patientId: $patientId,
        );
    }

    public static function forChat(
        string $userId,
        string $message,
        array $conversationHistory,
        ?array $currentContext = null,
    ): self {
        return new self(
            type: 'chat',
            context: [
                'conversation' => $conversationHistory,
                'current_context' => $currentContext,
            ],
            userMessage: $message,
            userId: $userId,
        );
    }

    public static function forMessage(
        string $patientId,
        array $patientData,
        string $messageType,
        array $messageContext,
    ): self {
        return new self(
            type: 'message_generation',
            context: [
                'patient' => $patientData,
                'message_type' => $messageType,
                'message_context' => $messageContext,
            ],
            patientId: $patientId,
        );
    }

    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'context' => $this->context,
            'user_message' => $this->userMessage,
            'user_id' => $this->userId,
            'patient_id' => $this->patientId,
            'options' => $this->options,
        ];
    }
}
