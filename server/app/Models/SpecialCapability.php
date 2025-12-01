<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SpecialCapability extends Model
{
    protected $table = 'special_capabilities';

    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Get all users with this capability
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'user_special_capabilities',
            'capability_id',
            'user_id'
        );
    }
}

