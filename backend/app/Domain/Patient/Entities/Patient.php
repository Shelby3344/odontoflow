<?php

declare(strict_types=1);

namespace App\Domain\Patient\Entities;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Shared\ValueObjects\Email;
use App\Domain\Shared\ValueObjects\Phone;
use App\Domain\Shared\ValueObjects\Document;
use App\Domain\Patient\ValueObjects\PatientStatus;
use App\Domain\Patient\Events\PatientCreated;
use App\Domain\Patient\Events\PatientUpdated;
use App\Domain\Shared\Entity;
use DateTimeImmutable;

final class Patient extends Entity
{
    private function __construct(
        private Uuid $id,
        private string $name,
        private ?Email $email,
        private ?Document $document,
        private ?DateTimeImmutable $birthDate,
        private ?string $gender,
        private ?Phone $phone,
        private ?Phone $whatsapp,
        private ?Address $address,
        private ?Guardian $guardian,
        private ?Insurance $insurance,
        private PatientStatus $status,
        private PatientPreferences $preferences,
        private PatientMetrics $metrics,
        private ?string $source,
        private ?DateTimeImmutable $firstVisitAt,
        private ?DateTimeImmutable $lastVisitAt,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {}

    public static function create(
        string $name,
        ?string $email = null,
        ?string $document = null,
        ?DateTimeImmutable $birthDate = null,
        ?string $gender = null,
        ?string $phone = null,
        ?string $whatsapp = null,
        ?array $address = null,
        ?array $guardian = null,
        ?string $source = null,
    ): self {
        $patient = new self(
            id: Uuid::generate(),
            name: $name,
            email: $email ? Email::fromString($email) : null,
            document: $document ? Document::fromCpf($document) : null,
            birthDate: $birthDate,
            gender: $gender,
            phone: $phone ? Phone::fromString($phone) : null,
            whatsapp: $whatsapp ? Phone::fromString($whatsapp) : null,
            address: $address ? Address::fromArray($address) : null,
            guardian: $guardian ? Guardian::fromArray($guardian) : null,
            insurance: null,
            status: PatientStatus::active(),
            preferences: PatientPreferences::default(),
            metrics: PatientMetrics::initial(),
            source: $source,
            firstVisitAt: null,
            lastVisitAt: null,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
        );

        $patient->recordEvent(new PatientCreated($patient));

        return $patient;
    }

    public static function fromPersistence(array $data): self
    {
        return new self(
            id: Uuid::fromString($data['id']),
            name: $data['name'],
            email: $data['email'] ? Email::fromString($data['email']) : null,
            document: $data['document'] ? Document::fromCpf($data['document']) : null,
            birthDate: $data['birth_date'] ? new DateTimeImmutable($data['birth_date']) : null,
            gender: $data['gender'],
            phone: $data['phone'] ? Phone::fromString($data['phone']) : null,
            whatsapp: $data['whatsapp'] ? Phone::fromString($data['whatsapp']) : null,
            address: $data['address'] ? Address::fromArray($data['address']) : null,
            guardian: $data['guardian'] ? Guardian::fromArray($data['guardian']) : null,
            insurance: $data['insurance'] ? Insurance::fromArray($data['insurance']) : null,
            status: PatientStatus::from($data['status']),
            preferences: PatientPreferences::fromArray($data['preferences'] ?? []),
            metrics: PatientMetrics::fromArray($data['metrics'] ?? []),
            source: $data['source'],
            firstVisitAt: $data['first_visit_at'] ? new DateTimeImmutable($data['first_visit_at']) : null,
            lastVisitAt: $data['last_visit_at'] ? new DateTimeImmutable($data['last_visit_at']) : null,
            createdAt: new DateTimeImmutable($data['created_at']),
            updatedAt: new DateTimeImmutable($data['updated_at']),
        );
    }

    public function update(
        ?string $name = null,
        ?string $email = null,
        ?string $phone = null,
        ?string $whatsapp = null,
        ?array $address = null,
    ): void {
        if ($name !== null) {
            $this->name = $name;
        }

        if ($email !== null) {
            $this->email = Email::fromString($email);
        }

        if ($phone !== null) {
            $this->phone = Phone::fromString($phone);
        }

        if ($whatsapp !== null) {
            $this->whatsapp = Phone::fromString($whatsapp);
        }

        if ($address !== null) {
            $this->address = Address::fromArray($address);
        }

        $this->updatedAt = new DateTimeImmutable();
        $this->recordEvent(new PatientUpdated($this));
    }

    public function registerVisit(): void
    {
        $now = new DateTimeImmutable();
        
        if ($this->firstVisitAt === null) {
            $this->firstVisitAt = $now;
        }
        
        $this->lastVisitAt = $now;
        $this->updatedAt = $now;
    }

    public function updateMetrics(PatientMetrics $metrics): void
    {
        $this->metrics = $metrics;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function deactivate(): void
    {
        $this->status = PatientStatus::inactive();
        $this->updatedAt = new DateTimeImmutable();
    }

    public function activate(): void
    {
        $this->status = PatientStatus::active();
        $this->updatedAt = new DateTimeImmutable();
    }

    public function assignInsurance(Insurance $insurance): void
    {
        $this->insurance = $insurance;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function getAge(): ?int
    {
        if ($this->birthDate === null) {
            return null;
        }

        return $this->birthDate->diff(new DateTimeImmutable())->y;
    }

    public function isMinor(): bool
    {
        $age = $this->getAge();
        return $age !== null && $age < 18;
    }

    public function hasHighNoShowRisk(): bool
    {
        return $this->metrics->attendanceScore < 0.7;
    }

    public function hasAbandonmentRisk(): bool
    {
        return $this->metrics->riskScore > 0.6;
    }

    // Getters
    public function id(): Uuid { return $this->id; }
    public function name(): string { return $this->name; }
    public function email(): ?Email { return $this->email; }
    public function document(): ?Document { return $this->document; }
    public function birthDate(): ?DateTimeImmutable { return $this->birthDate; }
    public function gender(): ?string { return $this->gender; }
    public function phone(): ?Phone { return $this->phone; }
    public function whatsapp(): ?Phone { return $this->whatsapp; }
    public function address(): ?Address { return $this->address; }
    public function guardian(): ?Guardian { return $this->guardian; }
    public function insurance(): ?Insurance { return $this->insurance; }
    public function status(): PatientStatus { return $this->status; }
    public function preferences(): PatientPreferences { return $this->preferences; }
    public function metrics(): PatientMetrics { return $this->metrics; }
    public function source(): ?string { return $this->source; }
    public function firstVisitAt(): ?DateTimeImmutable { return $this->firstVisitAt; }
    public function lastVisitAt(): ?DateTimeImmutable { return $this->lastVisitAt; }
    public function createdAt(): DateTimeImmutable { return $this->createdAt; }
    public function updatedAt(): DateTimeImmutable { return $this->updatedAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id->toString(),
            'name' => $this->name,
            'email' => $this->email?->toString(),
            'document' => $this->document?->masked(),
            'birth_date' => $this->birthDate?->format('Y-m-d'),
            'gender' => $this->gender,
            'age' => $this->getAge(),
            'phone' => $this->phone?->toString(),
            'whatsapp' => $this->whatsapp?->toString(),
            'address' => $this->address?->toArray(),
            'guardian' => $this->guardian?->toArray(),
            'insurance' => $this->insurance?->toArray(),
            'status' => $this->status->value,
            'preferences' => $this->preferences->toArray(),
            'metrics' => $this->metrics->toArray(),
            'source' => $this->source,
            'first_visit_at' => $this->firstVisitAt?->format('c'),
            'last_visit_at' => $this->lastVisitAt?->format('c'),
            'created_at' => $this->createdAt->format('c'),
            'updated_at' => $this->updatedAt->format('c'),
        ];
    }
}
