<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIInteraction extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'context_type',
        'context_data',
        'prompt',
        'model',
        'response',
        'tokens_used',
        'latency_ms',
        'was_accepted',
        'was_edited',
        'user_feedback',
        'feedback_notes',
        'cost_usd',
    ];

    protected $casts = [
        'context_data' => 'array',
        'was_accepted' => 'boolean',
        'was_edited' => 'boolean',
        'cost_usd' => 'decimal:6',
        'created_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->created_at = now();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
