<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name',
        'project_code',
        'status',
        'project_manager',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    /**
     * Get all users assigned to this project
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}

