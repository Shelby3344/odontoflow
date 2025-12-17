<?php

declare(strict_types=1);

namespace App\Domain\Patient\Entities;

final readonly class PatientPreferences
{
    public function __construct(
        public string $preferredContact,      // whatsapp, sms, email, phone
        public ?string $preferredScheduleTime, // morning, afternoon, evening
        public bool $communicationConsent,
        public bool $marketingConsent,
        public bool $reminderEnabled,
    ) {}

    public static function default(): self
    {
        return new self(
            preferredContact: 'whatsapp',
            preferredScheduleTime: null,
            communicationConsent: true,
            marketingConsent: false,
            reminderEnabled: true,
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            preferredContact: $data['preferred_contact'] ?? 'whatsapp',
            preferredScheduleTime: $data['preferred_schedule_time'] ?? null,
            communicationConsent: $data['communication_consent'] ?? true,
            marketingConsent: $data['marketing_consent'] ?? false,
            reminderEnabled: $data['reminder_enabled'] ?? true,
        );
    }

    public function canReceiveCommunication(): bool
    {
        return $this->communicationConsent;
    }

    public function canReceiveMarketing(): bool
    {
        return $this->marketingConsent;
    }

    public function toArray(): array
    {
        return [
            'preferred_contact' => $this->preferredContact,
            'preferred_schedule_time' => $this->preferredScheduleTime,
            'communication_consent' => $this->communicationConsent,
            'marketing_consent' => $this->marketingConsent,
            'reminder_enabled' => $this->reminderEnabled,
        ];
    }
}
