<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OdontogramHistory extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $table = 'odontogram_history';

    protected $fillable = [
        'odontogram_id',
        'tooth_number',
        'previous_data',
        'new_data',
        'change_type',
        'changed_by',
        'procedure_id',
    ];

    protected $casts = [
        'previous_data' => 'array',
        'new_data' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->created_at = now();
        });
    }

    public function odontogram(): BelongsTo
    {
        return $this->belongsTo(Odontogram::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
