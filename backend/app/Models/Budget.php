<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Budget extends Model
{
    use HasUuids;

    protected $fillable = [
        'patient_id',
        'professional_id',
        'items',
        'subtotal',
        'discount',
        'total',
        'notes',
        'valid_until',
        'status',
        'approved_at',
        'approved_by',
        'sent_at',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'valid_until' => 'date',
        'approved_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function professional(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professional_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function isExpired(): bool
    {
        return $this->valid_until < now() && $this->status === 'pending';
    }
}
