<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'max_days',
        'description',
        'requires_document',
        'requires_approval',
        'is_active',
    ];

    protected $casts = [
        'requires_document' => 'boolean',
        'requires_approval' => 'boolean',
        'is_active' => 'boolean',
        'max_days' => 'integer',
    ];

    /**
     * Get all leave applications for this leave type
     */
    public function leaveApplications()
    {
        return $this->hasMany(Leave::class);
    }

    /**
     * Scope to get only active leave types
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

