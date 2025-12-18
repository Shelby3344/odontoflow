<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunicationLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'patient_id',
        'appointment_id',
        'channel',
        'type',
        'template_id',
        'content',
        'status',
        'external_id',
        'error_message',
        'sent_by',
        'delivered_at',
        'read_at',
    ];

    protected $casts = [
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(MessageTemplate::class);
    }

    public function sentBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
