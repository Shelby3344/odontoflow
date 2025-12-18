<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'patient_id',
        'professional_id',
        'start_time',
        'end_time',
        'duration',
        'type',
        'procedure_type_id',
        'status',
        'confirmed_at',
        'confirmed_via',
        'notes',
        'internal_notes',
        'ai_risk_score',
        'ai_suggested',
        'recurrence_id',
        'recurrence_rule',
        'cancelled_at',
        'cancelled_reason',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'ai_risk_score' => 'decimal:2',
            'ai_suggested' => 'boolean',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function professional()
    {
        return $this->belongsTo(User::class, 'professional_id');
    }

    public function scopeForProfessional($query, string $professionalId)
    {
        return $query->where('professional_id', $professionalId);
    }

    public function scopeBetweenDates($query, $start, $end)
    {
        return $query->whereBetween('start_time', [$start, $end]);
    }
}
