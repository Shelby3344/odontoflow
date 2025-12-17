<?php

declare(strict_types=1);

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Patient\Services\PatientService;
use App\Application\Patient\DTOs\CreatePatientDTO;
use App\Application\Patient\DTOs\UpdatePatientDTO;
use App\Application\Patient\DTOs\PatientListDTO;
use App\Interfaces\Http\Requests\Patient\CreatePatientRequest;
use App\Interfaces\Http\Requests\Patient\UpdatePatientRequest;
use App\Interfaces\Http\Resources\PatientResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class PatientController
{
    public function __construct(
        private readonly PatientService $patientService,
    ) {}

    /**
     * Lista pacientes com filtros e paginação
     */
    public function index(Request $request): JsonResponse
    {
        $dto = new PatientListDTO(
            query: $request->get('q'),
            status: $request->get('status'),
            limit: (int) $request->get('limit', 20),
            offset: (int) $request->get('offset', 0),
        );

        $result = $this->patientService->list($dto);

        return response()->json($result);
    }

    /**
     * Cria novo paciente
     */
    public function store(CreatePatientRequest $request): JsonResponse
    {
        $dto = CreatePatientDTO::fromRequest($request->validated());
        $patient = $this->patientService->create($dto);

        return response()->json([
            'data' => $patient->toArray(),
            'message' => 'Paciente criado com sucesso',
        ], 201);
    }

    /**
     * Exibe detalhes do paciente
     */
    public function show(string $id): JsonResponse
    {
        $patient = $this->patientService->findById($id);

        if (!$patient) {
            return response()->json([
                'error' => 'Paciente não encontrado',
            ], 404);
        }

        return response()->json([
            'data' => $patient->toArray(),
        ]);
    }

    /**
     * Atualiza paciente
     */
    public function update(UpdatePatientRequest $request, string $id): JsonResponse
    {
        $dto = UpdatePatientDTO::fromRequest($request->validated());
        $patient = $this->patientService->update($id, $dto);

        return response()->json([
            'data' => $patient->toArray(),
            'message' => 'Paciente atualizado com sucesso',
        ]);
    }

    /**
     * Desativa paciente (soft delete)
     */
    public function destroy(string $id): JsonResponse
    {
        $this->patientService->deactivate($id);

        return response()->json([
            'message' => 'Paciente desativado com sucesso',
        ]);
    }

    /**
     * Pacientes em risco de abandono
     */
    public function atRisk(): JsonResponse
    {
        $patients = $this->patientService->getAtRiskPatients();

        return response()->json([
            'data' => array_map(fn($p) => $p->toArray(), $patients),
        ]);
    }

    /**
     * Pacientes inativos
     */
    public function inactive(Request $request): JsonResponse
    {
        $days = (int) $request->get('days', 90);
        $patients = $this->patientService->getInactivePatients($days);

        return response()->json([
            'data' => array_map(fn($p) => $p->toArray(), $patients),
        ]);
    }

    /**
     * Aniversariantes da semana
     */
    public function birthdays(): JsonResponse
    {
        $patients = $this->patientService->getBirthdaysThisWeek();

        return response()->json([
            'data' => array_map(fn($p) => [
                'id' => $p->id()->toString(),
                'name' => $p->name(),
                'birth_date' => $p->birthDate()?->format('Y-m-d'),
                'phone' => $p->phone()?->toString(),
                'whatsapp' => $p->whatsapp()?->toString(),
            ], $patients),
        ]);
    }
}
