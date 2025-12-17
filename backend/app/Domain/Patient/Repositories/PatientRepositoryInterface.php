<?php

declare(strict_types=1);

namespace App\Domain\Patient\Repositories;

use App\Domain\Patient\Entities\Patient;
use App\Domain\Shared\ValueObjects\Uuid;

interface PatientRepositoryInterface
{
    public function findById(Uuid $id): ?Patient;
    
    public function findByDocument(string $documentHash): ?Patient;
    
    public function findByEmail(string $email): ?Patient;
    
    public function findByPhone(string $phone): ?Patient;
    
    public function save(Patient $patient): void;
    
    public function delete(Uuid $id): void;
    
    /**
     * @return Patient[]
     */
    public function search(
        ?string $query = null,
        ?string $status = null,
        ?int $limit = 20,
        ?int $offset = 0,
    ): array;
    
    public function count(?string $status = null): int;
    
    /**
     * Pacientes com risco de abandono
     * @return Patient[]
     */
    public function findAtRisk(float $minRiskScore = 0.6): array;
    
    /**
     * Pacientes inativos há X dias
     * @return Patient[]
     */
    public function findInactive(int $days = 90): array;
    
    /**
     * Aniversariantes do período
     * @return Patient[]
     */
    public function findBirthdays(\DateTimeImmutable $start, \DateTimeImmutable $end): array;
}
