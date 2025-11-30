<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PersonalDataSheet extends Model
{
    protected $fillable = [
        'user_id',
        'form_data',
        'status',
        'hr_comments',
        'reviewed_by',
        'submitted_at',
        'reviewed_at',
        'approved_at',
    ];

    protected $casts = [
        'form_data' => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    /**
     * Get the user that owns the PDS
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the HR officer who reviewed the PDS
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Check if PDS is in draft status
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if PDS is pending review
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if PDS is approved
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if PDS is declined
     */
    public function isDeclined(): bool
    {
        return $this->status === 'declined';
    }
}
