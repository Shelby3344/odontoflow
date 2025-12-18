<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MedicalRecord extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'patient_id',
        'professional_id',
        'appointment_id',
        'chief_complaint',
        'clinical_examination',
        'diagnosis',
        'treatment_plan',
        'procedures_performed',
        'prescriptions',
        'observations',
        'ai_generated',
        'ai_suggestions',
        'ai_confidence',
        'version',
        'previous_version_id',
        'signed_at',
        'signature_hash',
    ];

    protected $casts = [
        'ai_generated' => 'boolean',
        'ai_suggestions' => 'array',
        'ai_confidence' => 'decimal:2',
        'signed_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function professional(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professional_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function previousVersion(): BelongsTo
    {
        return $this->belongsTo(MedicalRecord::class, 'previous_version_id');
    }

    public function isSigned(): bool
    {
        return $this->signed_at !== null;
    }

    public function sign(): void
    {
        $this->update([
            'signed_at' => now(),
            'signature_hash' => hash('sha256', json_encode([
                'id' => $this->id,
                'content' => $this->toArray(),
                'timestamp' => now()->toIso8601String(),
            ])),
        ]);
    }
}
