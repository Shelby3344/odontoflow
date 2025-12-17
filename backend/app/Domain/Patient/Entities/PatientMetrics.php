<?php

declare(strict_types=1);

namespace App\Domain\Patient\Entities;

final readonly class PatientMetrics
{
    public function __construct(
        public float $attendanceScore,  // 0-1: Taxa de comparecimento
        public float $engagementScore,  // 0-1: Engajamento com a clínica
        public float $riskScore,        // 0-1: Risco de abandono
    ) {}

    public static function initial(): self
    {
        return new self(
            attendanceScore: 1.0,
            engagementScore: 0.5,
            riskScore: 0.0,
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            attendanceScore: (float) ($data['attendance_score'] ?? 1.0),
            engagementScore: (float) ($data['engagement_score'] ?? 0.5),
            riskScore: (float) ($data['risk_score'] ?? 0.0),
        );
    }

    public function withUpdatedAttendance(int $attended, int $total): self
    {
        $newScore = $total > 0 ? $attended / $total : 1.0;
        
        return new self(
            attendanceScore: round($newScore, 2),
            engagementScore: $this->engagementScore,
            riskScore: $this->calculateRisk($newScore, $this->engagementScore),
        );
    }

    public function withUpdatedEngagement(float $score): self
    {
        return new self(
            attendanceScore: $this->attendanceScore,
            engagementScore: round($score, 2),
            riskScore: $this->calculateRisk($this->attendanceScore, $score),
        );
    }

    private function calculateRisk(float $attendance, float $engagement): float
    {
        // Fórmula simples: risco aumenta com baixa frequência e baixo engajamento
        $risk = (1 - $attendance) * 0.6 + (1 - $engagement) * 0.4;
        return round(min(1.0, max(0.0, $risk)), 2);
    }

    public function toArray(): array
    {
        return [
            'attendance_score' => $this->attendanceScore,
            'engagement_score' => $this->engagementScore,
            'risk_score' => $this->riskScore,
        ];
    }
}
