<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'document',
        'document_hash',
        'birth_date',
        'gender',
        'phone',
        'phone_secondary',
        'whatsapp',
        'address_street',
        'address_number',
        'address_complement',
        'address_neighborhood',
        'address_city',
        'address_state',
        'address_zipcode',
        'guardian_name',
        'guardian_document',
        'guardian_phone',
        'insurance_id',
        'insurance_number',
        'insurance_validity',
        'preferred_contact',
        'preferred_schedule_time',
        'communication_consent',
        'marketing_consent',
        'attendance_score',
        'engagement_score',
        'risk_score',
        'status',
        'source',
        'first_visit_at',
        'last_visit_at',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'insurance_validity' => 'date',
            'communication_consent' => 'boolean',
            'marketing_consent' => 'boolean',
            'attendance_score' => 'decimal:2',
            'engagement_score' => 'decimal:2',
            'risk_score' => 'decimal:2',
            'first_visit_at' => 'datetime',
            'last_visit_at' => 'datetime',
        ];
    }

    public function getAgeAttribute(): ?int
    {
        return $this->birth_date?->age;
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function medicalRecords()
    {
        return $this->hasMany(MedicalRecord::class);
    }

    public function odontogram()
    {
        return $this->hasOne(Odontogram::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeSearch($query, ?string $search)
    {
        if (!$search) return $query;
        
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%")
              ->orWhere('phone', 'like', "%{$search}%");
        });
    }
}
