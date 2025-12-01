<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Office extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'address',
        'contact_person',
        'contact_email',
        'contact_phone',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    /**
     * Get all users assigned to this office
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
