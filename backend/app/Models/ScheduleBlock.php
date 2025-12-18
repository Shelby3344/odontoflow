<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleBlock extends Model
{
    use HasUuids;

    protected $fillable = [
        'professional_id',
        'start_time',
        'end_time',
        'type',
        'title',
        'description',
        'is_recurring',
        'recurrence_rule',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_recurring' => 'boolean',
    ];

    public function professional(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professional_id');
    }
}
