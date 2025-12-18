<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Odontogram extends Model
{
    use HasUuids;

    protected $fillable = [
        'patient_id',
        'teeth_data',
        'type',
    ];

    protected $casts = [
        'teeth_data' => 'array',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(OdontogramHistory::class);
    }
}
