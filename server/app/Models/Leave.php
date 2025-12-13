<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Leave extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'exclusive_dates',
        'working_days',
        'remarks',
        'commutation',
        'leave_credit_authorized_officer_id',
        'recommendation_approver_id',
        'leave_approver_id',
        'show_remarks_to_leave_credit_officer',
        'show_remarks_to_recommendation_approver',
        'show_remarks_to_leave_approver',
        'status',
        'approved_by',
        'approved_at',
        'approval_remarks',
        // Multi-stage approval fields
        'leave_credit_officer_approved',
        'leave_credit_officer_approved_by',
        'leave_credit_officer_approved_at',
        'leave_credit_officer_remarks',
        'recommendation_approver_approved',
        'recommendation_approver_approved_by',
        'recommendation_approver_approved_at',
        'recommendation_approver_remarks',
        'leave_approver_approved',
        'leave_approver_approved_by',
        'leave_approver_approved_at',
        'leave_approver_remarks',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'exclusive_dates' => 'array',
        'working_days' => 'integer',
        'show_remarks_to_leave_credit_officer' => 'boolean',
        'show_remarks_to_recommendation_approver' => 'boolean',
        'show_remarks_to_leave_approver' => 'boolean',
        'approved_at' => 'datetime',
        'leave_credit_officer_approved' => 'boolean',
        'leave_credit_officer_approved_at' => 'datetime',
        'recommendation_approver_approved' => 'boolean',
        'recommendation_approver_approved_at' => 'datetime',
        'leave_approver_approved' => 'boolean',
        'leave_approver_approved_at' => 'datetime',
    ];

    /**
     * Get the user who created this leave application
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the leave type
     */
    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    /**
     * Get the leave credit authorized officer
     */
    public function leaveCreditAuthorizedOfficer(): BelongsTo
    {
        return $this->belongsTo(ApprovalName::class, 'leave_credit_authorized_officer_id');
    }

    /**
     * Get the recommendation approver
     */
    public function recommendationApprover(): BelongsTo
    {
        return $this->belongsTo(ApprovalName::class, 'recommendation_approver_id');
    }

    /**
     * Get the leave approver
     */
    public function leaveApprover(): BelongsTo
    {
        return $this->belongsTo(ApprovalName::class, 'leave_approver_id');
    }

    /**
     * Get the user who approved this leave
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user who approved at Leave Credit Officer stage
     */
    public function leaveCreditOfficerApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leave_credit_officer_approved_by');
    }

    /**
     * Get the user who approved at Recommendation Approver stage
     */
    public function recommendationApproverApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recommendation_approver_approved_by');
    }

    /**
     * Get the user who approved at Leave Approver stage
     */
    public function leaveApproverApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leave_approver_approved_by');
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get leaves for a specific user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get pending leaves
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get approved leaves
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}

