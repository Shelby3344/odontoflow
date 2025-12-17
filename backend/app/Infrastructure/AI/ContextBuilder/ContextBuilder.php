<?php

declare(strict_types=1);

namespace App\Infrastructure\AI\ContextBuilder;

use App\Domain\AI\DTOs\AIRequest;
use App\Domain\Patient\Repositories\PatientRepositoryInterface;
use App\Domain\Clinical\Repositories\MedicalRecordRepositoryInterface;
use App\Domain\Clinical\Repositories\OdontogramRepositoryInterface;
use App\Domain\Schedule\Repositories\AppointmentRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;

final class ContextBuilder
{
    public function __construct(
        private readonly PatientRepositoryInterface $patientRepository,
        private readonly MedicalRecordRepositoryInterface $medicalRecordRepository,
        private readonly OdontogramRepositoryInterface $odontogramRepository,
        private readonly AppointmentRepositoryInterface $appointmentRepository,
    ) {}

    public function build(AIRequest $request): array
    {
        $context = $request->context;

        // Enriquecer com dados do paciente se disponível
        if ($request->patientId) {
            $context = $this->enrichWithPatientData($context, $request->patientId);
        }

        // Adicionar contexto específico por tipo
        $context = match ($request->type) {
            'clinical_evolution' => $this->enrichForClinicalEvolution($context),
            'diagnosis_suggestion' => $this->enrichForDiagnosis($context),
            'treatment_plan' => $this->enrichForTreatmentPlan($context),
            'no_show_risk' => $this->enrichForNoShowRisk($context),
            'chat' => $this->enrichForChat($context, $request->userId),
            default => $context,
        };

        // Adicionar metadados
        $context['_meta'] = [
            'type' => $request->type,
            'timestamp' => now()->toIso8601String(),
            'user_id' => $request->userId,
        ];

        return $context;
    }

    private function enrichWithPatientData(array $context, string $patientId): array
    {
        $patient = $this->patientRepository->findById(Uuid::fromString($patientId));
        
        if (!$patient) {
            return $context;
        }

        // Dados básicos do paciente (sem PII sensível para o prompt)
        $context['patient_profile'] = [
            'age' => $patient->getAge(),
            'gender' => $patient->gender(),
            'attendance_score' => $patient->metrics()->attendanceScore,
            'risk_score' => $patient->metrics()->riskScore,
            'first_visit' => $patient->firstVisitAt()?->format('Y-m-d'),
            'last_visit' => $patient->lastVisitAt()?->format('Y-m-d'),
        ];

        // Histórico clínico resumido
        $records = $this->medicalRecordRepository->findByPatient(
            Uuid::fromString($patientId),
            limit: 5
        );

        $context['clinical_history'] = array_map(fn($record) => [
            'date' => $record->createdAt()->format('Y-m-d'),
            'diagnosis' => $record->diagnosis(),
            'procedures' => $record->proceduresPerformed(),
        ], $records);

        // Odontograma atual
        $odontogram = $this->odontogramRepository->findByPatient(Uuid::fromString($patientId));
        if ($odontogram) {
            $context['odontogram_summary'] = $this->summarizeOdontogram($odontogram);
        }

        return $context;
    }

    private function enrichForClinicalEvolution(array $context): array
    {
        // Adicionar templates de evolução comuns
        $context['evolution_guidelines'] = [
            'structure' => [
                'queixa_principal',
                'exame_clinico',
                'diagnostico',
                'procedimentos_realizados',
                'orientacoes',
                'retorno',
            ],
            'tone' => 'técnico e objetivo',
            'format' => 'texto corrido com parágrafos',
        ];

        return $context;
    }

    private function enrichForDiagnosis(array $context): array
    {
        // Adicionar categorias de diagnóstico comuns
        $context['diagnosis_categories'] = [
            'carie' => ['inicial', 'media', 'profunda', 'com_comprometimento_pulpar'],
            'periodontal' => ['gengivite', 'periodontite_leve', 'periodontite_moderada', 'periodontite_severa'],
            'endodontico' => ['pulpite_reversivel', 'pulpite_irreversivel', 'necrose_pulpar', 'abscesso'],
            'protese' => ['ausencia_dental', 'protese_mal_adaptada', 'necessidade_reabilitacao'],
            'ortodontia' => ['ma_oclusao', 'apinhamento', 'diastema'],
        ];

        $context['diagnosis_guidelines'] = [
            'always_suggest_multiple_possibilities',
            'indicate_confidence_level',
            'recommend_additional_exams_if_needed',
            'never_replace_professional_judgment',
        ];

        return $context;
    }

    private function enrichForTreatmentPlan(array $context): array
    {
        $context['treatment_guidelines'] = [
            'prioritize_by' => ['urgency', 'patient_preference', 'cost_benefit'],
            'consider' => ['patient_age', 'medical_history', 'financial_situation'],
            'include' => ['estimated_sessions', 'approximate_duration', 'alternatives'],
        ];

        return $context;
    }

    private function enrichForNoShowRisk(array $context): array
    {
        // Adicionar padrões históricos da clínica
        $context['clinic_patterns'] = [
            'high_risk_days' => ['monday', 'friday'],
            'high_risk_times' => ['early_morning', 'late_afternoon'],
            'avg_no_show_rate' => 0.15,
        ];

        return $context;
    }

    private function enrichForChat(array $context, ?string $userId): array
    {
        // Adicionar contexto do usuário para personalização
        if ($userId) {
            $context['user_context'] = [
                'role' => 'dentist', // Buscar do banco
                'specialty' => null,
                'preferences' => [],
            ];
        }

        $context['assistant_guidelines'] = [
            'role' => 'assistente odontológico especializado',
            'capabilities' => [
                'responder dúvidas clínicas',
                'sugerir diagnósticos como apoio',
                'auxiliar na documentação',
                'fornecer informações sobre procedimentos',
            ],
            'limitations' => [
                'não substituir avaliação profissional',
                'não prescrever medicamentos',
                'não fazer diagnósticos definitivos',
            ],
        ];

        return $context;
    }

    private function summarizeOdontogram(object $odontogram): array
    {
        $teethData = $odontogram->teethData();
        
        $summary = [
            'total_teeth' => count($teethData),
            'healthy' => 0,
            'decayed' => 0,
            'restored' => 0,
            'missing' => 0,
            'needs_attention' => [],
        ];

        foreach ($teethData as $tooth => $data) {
            $status = $data['status'] ?? 'healthy';
            
            match ($status) {
                'healthy' => $summary['healthy']++,
                'decayed' => $summary['decayed']++,
                'restored' => $summary['restored']++,
                'missing' => $summary['missing']++,
                default => null,
            };

            if (in_array($status, ['decayed', 'needs_treatment'])) {
                $summary['needs_attention'][] = $tooth;
            }
        }

        return $summary;
    }
}
