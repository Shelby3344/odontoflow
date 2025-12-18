<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasUuids;

    protected $fillable = [
        'patient_id',
        'professional_id',
        'budget_id',
        'type',
        'category',
        'description',
        'amount',
        'due_date',
        'paid_at',
        'payment_method',
        'installment_number',
        'total_installments',
        'procedure_type',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function professional(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professional_id');
    }

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function isOverdue(): bool
    {
        return $this->status === 'pending' && $this->due_date < now();
    }
}
