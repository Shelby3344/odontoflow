<?php

declare(strict_types=1);

namespace App\Application\Patient\Services;

use App\Domain\Patient\Entities\Patient;
use App\Domain\Patient\Repositories\PatientRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Application\Patient\DTOs\CreatePatientDTO;
use App\Application\Patient\DTOs\UpdatePatientDTO;
use App\Application\Patient\DTOs\PatientListDTO;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

final class PatientService
{
    public function __construct(
        private readonly PatientRepositoryInterface $repository,
    ) {}

    public function create(CreatePatientDTO $dto): Patient
    {
        return DB::transaction(function () use ($dto) {
            $patient = Patient::create(
                name: $dto->name,
                email: $dto->email,
                document: $dto->document,
                birthDate: $dto->birthDate,
                gender: $dto->gender,
                phone: $dto->phone,
                whatsapp: $dto->whatsapp,
                address: $dto->address,
                guardian: $dto->guardian,
                source: $dto->source,
            );

            $this->repository->save($patient);

            // Disparar eventos de domínio
            foreach ($patient->pullDomainEvents() as $event) {
                Event::dispatch($event);
            }

            return $patient;
        });
    }

    public function update(string $id, UpdatePatientDTO $dto): Patient
    {
        return DB::transaction(function () use ($id, $dto) {
            $patient = $this->repository->findById(Uuid::fromString($id));

            if (!$patient) {
                throw new \DomainException("Patient not found: {$id}");
            }

            $patient->update(
                name: $dto->name,
                email: $dto->email,
                phone: $dto->phone,
                whatsapp: $dto->whatsapp,
                address: $dto->address,
            );

            $this->repository->save($patient);

            foreach ($patient->pullDomainEvents() as $event) {
                Event::dispatch($event);
            }

            return $patient;
        });
    }

    public function findById(string $id): ?Patient
    {
        return $this->repository->findById(Uuid::fromString($id));
    }

    public function list(PatientListDTO $dto): array
    {
        $patients = $this->repository->search(
            query: $dto->query,
            status: $dto->status,
            limit: $dto->limit,
            offset: $dto->offset,
        );

        $total = $this->repository->count($dto->status);

        return [
            'data' => array_map(fn($p) => $p->toArray(), $patients),
            'meta' => [
                'total' => $total,
                'limit' => $dto->limit,
                'offset' => $dto->offset,
                'has_more' => ($dto->offset + $dto->limit) < $total,
            ],
        ];
    }

    public function deactivate(string $id): void
    {
        $patient = $this->repository->findById(Uuid::fromString($id));

        if (!$patient) {
            throw new \DomainException("Patient not found: {$id}");
        }

        $patient->deactivate();
        $this->repository->save($patient);
    }

    public function getAtRiskPatients(): array
    {
        return $this->repository->findAtRisk();
    }

    public function getInactivePatients(int $days = 90): array
    {
        return $this->repository->findInactive($days);
    }

    public function getBirthdaysThisWeek(): array
    {
        $start = new \DateTimeImmutable('monday this week');
        $end = new \DateTimeImmutable('sunday this week');

        return $this->repository->findBirthdays($start, $end);
    }
}
