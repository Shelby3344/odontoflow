<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MessageTemplate extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'type',
        'channel',
        'subject',
        'content',
        'variables',
        'is_active',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_active' => 'boolean',
    ];
}
