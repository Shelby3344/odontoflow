<?php

declare(strict_types=1);

namespace App\Application\Patient\DTOs;

use DateTimeImmutable;

final readonly class CreatePatientDTO
{
    public function __construct(
        public string $name,
        public ?string $email = null,
        public ?string $document = null,
        public ?DateTimeImmutable $birthDate = null,
        public ?string $gender = null,
        public ?string $phone = null,
        public ?string $whatsapp = null,
        public ?array $address = null,
        public ?array $guardian = null,
        public ?string $source = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'] ?? null,
            document: $data['document'] ?? null,
            birthDate: isset($data['birth_date']) 
                ? new DateTimeImmutable($data['birth_date']) 
                : null,
            gender: $data['gender'] ?? null,
            phone: $data['phone'] ?? null,
            whatsapp: $data['whatsapp'] ?? null,
            address: $data['address'] ?? null,
            guardian: $data['guardian'] ?? null,
            source: $data['source'] ?? 'manual',
        );
    }
}
