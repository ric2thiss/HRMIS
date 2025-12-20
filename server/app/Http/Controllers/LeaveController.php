<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use App\Models\LeaveType;
use App\Services\WebSocketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Crypt;

class LeaveController extends Controller
{
    /**
     * Get all leave applications (filtered by user role)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            // Eager load roles to avoid N+1 query
            $user->load('roles');
            $role = $user->roles->first()?->name ?? $user->role?->name;

            $query = Leave::with([
                'user:id,employee_id,first_name,middle_initial,last_name,email,position_id,office_id,signature',
                'user.position:id,title',
                'user.office:id,name,code',
                'leaveType:id,code,name',
                'leaveCreditAuthorizedOfficer:id,name',
                'recommendationApprover:id,name',
                'leaveApprover:id,name',
                'approver:id,first_name,middle_initial,last_name',
                'leaveCreditOfficerApprover:id,first_name,middle_initial,last_name',
                'recommendationApproverApprover:id,first_name,middle_initial,last_name',
                'leaveApproverApprover:id,first_name,middle_initial,last_name'
            ]);

            // Regular users can only see their own leaves
            if ($role !== 'hr' && $role !== 'admin') {
                $query->where('user_id', $user->id);
            }

            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('user_id') && ($role === 'hr' || $role === 'admin')) {
                $query->where('user_id', $request->user_id);
            }

            $leaves = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'leaves' => $leaves
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching leave applications: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch leave applications',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get leave applications for the current user
     */
    public function myLeaves(Request $request)
    {
        try {
            $user = $request->user();

            $query = Leave::with([
                'leaveType:id,code,name',
                'leaveCreditAuthorizedOfficer:id,name',
                'recommendationApprover:id,name',
                'leaveApprover:id,name',
                'approver:id,first_name,middle_initial,last_name',
                'leaveCreditOfficerApprover:id,first_name,middle_initial,last_name',
                'recommendationApproverApprover:id,first_name,middle_initial,last_name',
                'leaveApproverApprover:id,first_name,middle_initial,last_name'
            ])->where('user_id', $user->id);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $leaves = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'leaves' => $leaves
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user leave applications: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch leave applications',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Store a newly created leave application
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'leave_type_id' => 'required|integer|exists:leave_types,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'exclusive_dates' => 'required|array|min:1',
                'exclusive_dates.*' => 'date',
                'working_days' => 'required|integer|min:1',
                'leave_credit_authorized_officer_id' => 'required|integer|exists:approval_names,id',
                'recommendation_approver_id' => 'required|integer|exists:approval_names,id',
                'leave_approver_id' => 'nullable|integer|exists:approval_names,id',
                'commutation' => 'required|in:Requested,Not Requested',
                'remarks' => 'nullable|string',
                'show_remarks_to' => 'nullable|array',
                'show_remarks_to.leave_credit_authorized_officer' => 'boolean',
                'show_remarks_to.recommendation_approver' => 'boolean',
                'show_remarks_to.leave_approver' => 'boolean',
            ]);

            // Validate that the leave type is active
            $leaveType = LeaveType::find($validated['leave_type_id']);
            if (!$leaveType || !$leaveType->is_active) {
                return response()->json([
                    'message' => 'The selected leave type is not available. Please select an active leave type.',
                    'errors' => ['leave_type_id' => ['The selected leave type is inactive.']]
                ], 422);
            }

            // Check if user has enough leave credits
            $usedDays = Leave::where('user_id', $user->id)
                ->where('leave_type_id', $leaveType->id)
                ->whereIn('status', ['approved', 'pending'])
                ->sum('working_days');
            
            $remainingDays = max(0, ($leaveType->max_days ?? 0) - $usedDays);
            
            if ($remainingDays <= 0) {
                return response()->json([
                    'message' => 'You have exhausted all available credits for ' . $leaveType->name . '. You cannot apply for this leave type.',
                    'errors' => ['leave_type_id' => ['Insufficient leave credits.']]
                ], 422);
            }
            
            // Check if the requested days exceed remaining credits
            if ($validated['working_days'] > $remainingDays) {
                return response()->json([
                    'message' => 'You only have ' . $remainingDays . ' remaining day(s) for ' . $leaveType->name . '. You cannot apply for ' . $validated['working_days'] . ' day(s).',
                    'errors' => ['working_days' => ['Insufficient leave credits.']]
                ], 422);
            }

            $leave = Leave::create([
                'user_id' => $user->id,
                'leave_type_id' => $validated['leave_type_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'exclusive_dates' => $validated['exclusive_dates'],
                'working_days' => $validated['working_days'],
                'leave_credit_authorized_officer_id' => $validated['leave_credit_authorized_officer_id'],
                'recommendation_approver_id' => $validated['recommendation_approver_id'],
                'leave_approver_id' => $validated['leave_approver_id'] ?? null,
                'commutation' => $validated['commutation'],
                'remarks' => $validated['remarks'] ?? null,
                'show_remarks_to_leave_credit_officer' => $validated['show_remarks_to']['leave_credit_authorized_officer'] ?? false,
                'show_remarks_to_recommendation_approver' => $validated['show_remarks_to']['recommendation_approver'] ?? false,
                'show_remarks_to_leave_approver' => $validated['show_remarks_to']['leave_approver'] ?? false,
                'status' => 'pending',
            ]);

            $leave->load([
                'leaveType:id,code,name',
                'leaveCreditAuthorizedOfficer:id,name',
                'recommendationApprover:id,name',
                'leaveApprover:id,name',
            ]);

            return response()->json([
                'message' => 'Leave application submitted successfully',
                'leave' => $leave
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating leave application: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to create leave application',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Display the specified leave application
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            // Eager load roles to avoid N+1 query
            $user->load('roles');
            $role = $user->roles->first()?->name ?? $user->role?->name;

            $leave = Leave::with([
                'user:id,employee_id,first_name,middle_initial,last_name,email,position_id,office_id,signature',
                'user.position:id,title',
                'user.office:id,name,code',
                'leaveType:id,code,name',
                'leaveCreditAuthorizedOfficer:id,name',
                'recommendationApprover:id,name',
                'leaveApprover:id,name',
                'approver:id,first_name,middle_initial,last_name',
                'leaveCreditOfficerApprover:id,first_name,middle_initial,last_name',
                'recommendationApproverApprover:id,first_name,middle_initial,last_name',
                'leaveApproverApprover:id,first_name,middle_initial,last_name'
            ])->findOrFail($id);

            // Check if user is authorized to view this leave
            $isAuthorized = false;
            
            // HR/Admin can always view
            if ($role === 'hr' || $role === 'admin') {
                $isAuthorized = true;
            }
            // Owner can always view their own leave
            elseif ($leave->user_id === $user->id) {
                $isAuthorized = true;
            }
            // Check if user is assigned as an approver for this leave
            else {
                $userApprovalNameIds = \App\Models\ApprovalName::where('user_id', $user->id)
                    ->where('is_active', true)
                    ->pluck('id')
                    ->toArray();

                if (!empty($userApprovalNameIds)) {
                    $isAuthorized = in_array($leave->leave_credit_authorized_officer_id, $userApprovalNameIds) ||
                                   in_array($leave->recommendation_approver_id, $userApprovalNameIds) ||
                                   in_array($leave->leave_approver_id, $userApprovalNameIds);
                }
            }

            if (!$isAuthorized) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You can only view your own leave applications or applications assigned to you for approval'
                ], 403);
            }

            return response()->json([
                'leave' => $leave
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Leave application not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching leave application: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch leave application',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Update the specified leave application (only for cancelling by owner)
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            $leave = Leave::findOrFail($id);

            // Only the owner can cancel their own leave
            if ($leave->user_id !== $user->id) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You can only update your own leave applications'
                ], 403);
            }

            // Only allow cancelling pending leaves
            if ($request->has('status') && $request->status === 'cancelled') {
                if ($leave->status !== 'pending') {
                    return response()->json([
                        'error' => 'Invalid operation',
                        'message' => 'You can only cancel pending leave applications'
                    ], 400);
                }

                $leave->update([
                    'status' => 'cancelled'
                ]);

                $leave->load([
                    'leaveType:id,code,name',
                    'leaveCreditAuthorizedOfficer:id,name',
                    'recommendationApprover:id,name',
                    'leaveApprover:id,name',
                ]);

                return response()->json([
                    'message' => 'Leave application cancelled successfully',
                    'leave' => $leave
                ]);
            }

            return response()->json([
                'error' => 'Invalid operation',
                'message' => 'You can only cancel your leave applications'
            ], 400);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Leave application not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error updating leave application: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to update leave application',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Approve or reject a leave application (HR/Admin or assigned approver)
     * For travel leave, implements multi-stage approval: Leave Credit Officer -> Recommendation Approver -> Leave Approver
     */
    public function approve(Request $request, $id)
    {
        try {
            $user = $request->user();
            // Eager load roles to avoid N+1 query
            $user->load('roles');
            $role = $user->roles->first()?->name ?? $user->role?->name;

            $validated = $request->validate([
                'status' => 'required|in:approved,rejected',
                'approval_remarks' => 'nullable|string',
                'signature' => 'required_if:status,approved|nullable|string', // Required for approval, optional for rejection
            ]);

            $leave = Leave::with([
                'leaveType:id,code,name',
                'leaveCreditAuthorizedOfficer:id,user_id',
                'recommendationApprover:id,user_id',
                'leaveApprover:id,user_id'
            ])->findOrFail($id);

            if ($leave->status !== 'pending') {
                return response()->json([
                    'error' => 'Invalid operation',
                    'message' => 'Only pending leave applications can be approved or rejected'
                ], 400);
            }

            // All leave types follow the 3-stage approval workflow:
            // Stage 1: Leave Credit Authorized Officer
            // Stage 2: Recommendation Approver
            // Stage 3: Leave Approver (final approval)

            // Get user's approval name IDs
            $userApprovalNameIds = \App\Models\ApprovalName::where('user_id', $user->id)
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();

            // Determine which approval stage the user is authorized for
            $currentStage = null;
            $isAuthorized = false;

            if ($role === 'hr' || $role === 'admin') {
                // HR/Admin can approve at any stage or final approval
                $isAuthorized = true;
                // Determine current stage for HR/Admin
                if (!$leave->leave_credit_officer_approved) {
                    $currentStage = 'leave_credit_officer';
                } elseif (!$leave->recommendation_approver_approved) {
                    $currentStage = 'recommendation_approver';
                } elseif (!$leave->leave_approver_approved) {
                    $currentStage = 'leave_approver';
                }
            } else {
                // Check if user is assigned as any type of approver for this leave
                if (!empty($userApprovalNameIds)) {
                    if (in_array($leave->leave_credit_authorized_officer_id, $userApprovalNameIds)) {
                        // User is the Leave Credit Authorized Officer
                        // Check if user has already approved at this stage
                        if ($leave->leave_credit_officer_approved_by === $user->id) {
                            // User has already approved at this stage - prevent re-approval
                            return response()->json([
                                'error' => 'Already Processed',
                                'message' => 'You have already processed this leave application at your stage. You cannot approve or reject again.'
                            ], 400);
                        }
                        // Check: stage must not be approved yet
                        if (!$leave->leave_credit_officer_approved) {
                            $currentStage = 'leave_credit_officer';
                            $isAuthorized = true;
                        }
                    } elseif (in_array($leave->recommendation_approver_id, $userApprovalNameIds)) {
                        // User is the Recommendation Approver
                        // Check if user has already approved at this stage
                        if ($leave->recommendation_approver_approved_by === $user->id) {
                            // User has already approved at this stage - prevent re-approval
                            return response()->json([
                                'error' => 'Already Processed',
                                'message' => 'You have already processed this leave application at your stage. You cannot approve or reject again.'
                            ], 400);
                        }
                        // Check: Stage 1 must be approved first
                        if (!$leave->leave_credit_officer_approved) {
                            // Stage 1 not yet approved - cannot proceed
                            return response()->json([
                                'error' => 'Sequential Order Required',
                                'message' => 'The Leave Credit Authorized Officer must decide first before you can approve or reject this application.'
                            ], 400);
                        }
                        // Check: Stage 2 must not be approved yet
                        if (!$leave->recommendation_approver_approved) {
                            $currentStage = 'recommendation_approver';
                            $isAuthorized = true;
                        }
                    } elseif (in_array($leave->leave_approver_id, $userApprovalNameIds)) {
                        // User is the Leave Approver
                        // Check if user has already approved at this stage
                        if ($leave->leave_approver_approved_by === $user->id) {
                            // User has already approved at this stage - prevent re-approval
                            return response()->json([
                                'error' => 'Already Processed',
                                'message' => 'You have already processed this leave application at your stage. You cannot approve or reject again.'
                            ], 400);
                        }
                        // Check: Previous stages must be approved first
                        if (!$leave->leave_credit_officer_approved || !$leave->recommendation_approver_approved) {
                            // Previous stages not yet approved - cannot proceed
                            return response()->json([
                                'error' => 'Sequential Order Required',
                                'message' => 'The previous approvers must decide first before you can approve or reject this application.'
                            ], 400);
                        }
                        // Check: Stage 3 must not be approved yet
                        if (!$leave->leave_approver_approved) {
                            $currentStage = 'leave_approver';
                            $isAuthorized = true;
                        }
                    }
                }
            }

            if (!$isAuthorized) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You are not authorized to approve/reject this leave application at this stage'
                ], 403);
            }

            // Check if user has signature for approval (not required for rejection)
            if ($validated['status'] === 'approved') {
                // Check if user has a signature in their profile
                // The accessor will automatically decrypt the signature when accessed
                if (empty($user->signature)) {
                    return response()->json([
                        'error' => 'Signature Required',
                        'message' => 'You must have an e-signature in your profile before you can approve leave applications. Please create your e-signature in your profile page first.'
                    ], 400);
                }

                // Validate that signature is provided in request
                if (empty($validated['signature'])) {
                    return response()->json([
                        'error' => 'Signature Required',
                        'message' => 'E-signature is required to approve this leave application.'
                    ], 422);
                }
            }

            // Handle rejection - reject immediately regardless of stage
            if ($validated['status'] === 'rejected') {
                $leave->update([
                    'status' => 'rejected',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                    'approval_remarks' => $validated['approval_remarks'] ?? null,
                ]);

                $leave->load([
                    'user:id,employee_id,first_name,middle_initial,last_name,email',
                    'leaveType:id,code,name',
                    'leaveCreditAuthorizedOfficer:id,name',
                    'recommendationApprover:id,name',
                    'leaveApprover:id,name',
                    'approver:id,first_name,middle_initial,last_name'
                ]);

                // Send real-time notification to leave applicant
                try {
                    $websocketService = new WebSocketService();
                    $websocketService->notifyUser($leave->user_id, [
                        'type' => 'warning',
                        'title' => 'Leave Application Rejected',
                        'message' => 'Your leave application has been rejected.',
                        'entity_type' => 'leave',
                        'entity_id' => $leave->id,
                        'data' => [
                            'leave_id' => $leave->id,
                            'status' => 'rejected',
                        ]
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Failed to send WebSocket notification for leave rejection: ' . $e->getMessage());
                }

                return response()->json([
                    'message' => 'Leave application rejected successfully',
                    'leave' => $leave
                ]);
            }

            // Handle approval - all leave types use 3-stage workflow
            if ($currentStage) {
                $updateData = [];
                
                if ($currentStage === 'leave_credit_officer') {
                    // Stage 1: Leave Credit Authorized Officer approves
                    // Status remains 'pending' until final approval
                    $updateData = [
                        'leave_credit_officer_approved' => true,
                        'leave_credit_officer_approved_by' => $user->id,
                        'leave_credit_officer_approved_at' => now(),
                        'leave_credit_officer_remarks' => $validated['approval_remarks'] ?? null,
                        'leave_credit_officer_signature' => !empty($validated['signature']) ? Crypt::encryptString($validated['signature']) : null, // Store encrypted signature
                        // Status stays 'pending' - don't change it yet
                    ];
                } elseif ($currentStage === 'recommendation_approver') {
                    // Stage 2: Recommendation Approver approves
                    // Status remains 'pending' until final approval
                    $updateData = [
                        'recommendation_approver_approved' => true,
                        'recommendation_approver_approved_by' => $user->id,
                        'recommendation_approver_approved_at' => now(),
                        'recommendation_approver_remarks' => $validated['approval_remarks'] ?? null,
                        'recommendation_approver_signature' => !empty($validated['signature']) ? Crypt::encryptString($validated['signature']) : null, // Store encrypted signature
                        // Status stays 'pending' - don't change it yet
                    ];
                } elseif ($currentStage === 'leave_approver') {
                    // Stage 3: Leave Approver approves - FINAL APPROVAL
                    // Now we can mark the leave as fully approved
                    $updateData = [
                        'leave_approver_approved' => true,
                        'leave_approver_approved_by' => $user->id,
                        'leave_approver_approved_at' => now(),
                        'leave_approver_remarks' => $validated['approval_remarks'] ?? null,
                        'leave_approver_signature' => !empty($validated['signature']) ? Crypt::encryptString($validated['signature']) : null, // Store encrypted signature
                        'status' => 'approved',
                        'approved_by' => $user->id,
                        'approved_at' => now(),
                        'approval_remarks' => $validated['approval_remarks'] ?? null,
                    ];
                }

                if (!empty($updateData)) {
                    $leave->update($updateData);
                }
            } else {
                // All stages are already approved - check if status needs to be updated
                // This handles edge cases where all approvals are done but status wasn't updated
                if ($leave->leave_credit_officer_approved && 
                    $leave->recommendation_approver_approved && 
                    $leave->leave_approver_approved && 
                    $leave->status === 'pending') {
                    // Fix data inconsistency - all approvals done but status still pending
                    $leave->update([
                        'status' => 'approved',
                        'approved_by' => $user->id,
                        'approved_at' => now(),
                    ]);
                } else {
                    // No stage available for approval - this shouldn't happen for pending leaves
                    return response()->json([
                        'error' => 'Invalid operation',
                        'message' => 'This leave application has already been processed or all approval stages are complete'
                    ], 400);
                }
            }

            $leave->load([
                'user:id,employee_id,first_name,middle_initial,last_name,email',
                'leaveType:id,code,name',
                'leaveCreditAuthorizedOfficer:id,name',
                'recommendationApprover:id,name',
                'leaveApprover:id,name',
                'approver:id,first_name,middle_initial,last_name',
                'leaveCreditOfficerApprover:id,first_name,middle_initial,last_name',
                'recommendationApproverApprover:id,first_name,middle_initial,last_name',
                'leaveApproverApprover:id,first_name,middle_initial,last_name'
            ]);

            // Send real-time notification if fully approved
            if ($leave->status === 'approved') {
                try {
                    $websocketService = new WebSocketService();
                    $websocketService->notifyUser($leave->user_id, [
                        'type' => 'success',
                        'title' => 'Leave Application Approved',
                        'message' => 'Your leave application has been fully approved!',
                        'entity_type' => 'leave',
                        'entity_id' => $leave->id,
                        'data' => [
                            'leave_id' => $leave->id,
                            'status' => 'approved',
                        ]
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Failed to send WebSocket notification for leave approval: ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => "Leave application approved successfully",
                'leave' => $leave
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Leave application not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error approving/rejecting leave application: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to process leave application',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Delete a leave application (only pending ones by owner)
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            $leave = Leave::findOrFail($id);

            // Only the owner can delete their own leave
            if ($leave->user_id !== $user->id) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You can only delete your own leave applications'
                ], 403);
            }

            // Only allow deleting pending leaves
            if ($leave->status !== 'pending') {
                return response()->json([
                    'error' => 'Invalid operation',
                    'message' => 'You can only delete pending leave applications'
                ], 400);
            }

            $leave->delete();

            return response()->json([
                'message' => 'Leave application deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Leave application not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting leave application: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to delete leave application',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get all leave types
     */
    public function getLeaveTypes()
    {
        try {
            $leaveTypes = LeaveType::active()->orderBy('name')->get();
            return response()->json([
                'leave_types' => $leaveTypes
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching leave types: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch leave types',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get leave credits (remaining days) for the current user
     */
    public function getMyLeaveCredits(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get all active leave types
            $leaveTypes = LeaveType::active()->orderBy('name')->get();
            
            $leaveCredits = [];
            
            foreach ($leaveTypes as $leaveType) {
                // Calculate used days (approved + pending leaves)
                $usedDays = Leave::where('user_id', $user->id)
                    ->where('leave_type_id', $leaveType->id)
                    ->whereIn('status', ['approved', 'pending'])
                    ->sum('working_days');
                
                // Calculate remaining days
                $remainingDays = max(0, ($leaveType->max_days ?? 0) - $usedDays);
                
                $leaveCredits[] = [
                    'id' => $leaveType->id,
                    'code' => $leaveType->code,
                    'name' => $leaveType->name,
                    'max_days' => $leaveType->max_days ?? 0,
                    'used_days' => $usedDays,
                    'remaining_days' => $remainingDays,
                ];
            }
            
            return response()->json([
                'leave_credits' => $leaveCredits
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching leave credits: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch leave credits',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get pending approvals for the current approver
     * Shows ALL pending leaves where user is assigned as any of the 3 approvers,
     * regardless of whether it's their turn yet (so they can see the status)
     */
    public function myPendingApprovals(Request $request)
    {
        try {
            $user = $request->user();
            // Eager load roles to avoid N+1 query
            $user->load('roles');
            $role = $user->roles->first()?->name ?? $user->role?->name;
            
            // Get all approval_name IDs where the current user is assigned
            $approvalNameIds = \App\Models\ApprovalName::where('user_id', $user->id)
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();

            if (empty($approvalNameIds) && $role !== 'hr' && $role !== 'admin') {
                return response()->json([
                    'leaves' => [],
                    'pds' => []
                ]);
            }

            // Get ALL pending leave applications where user is assigned as ANY of the 3 approvers
            // This allows approvers to see leaves even if it's not their turn yet
            $query = Leave::with([
                'user:id,employee_id,first_name,middle_initial,last_name,email',
                'leaveType:id,code,name',
                'leaveCreditAuthorizedOfficer:id,name',
                'recommendationApprover:id,name',
                'leaveApprover:id,name',
                'leaveCreditOfficerApprover:id,first_name,middle_initial,last_name',
                'recommendationApproverApprover:id,first_name,middle_initial,last_name',
                'leaveApproverApprover:id,first_name,middle_initial,last_name',
            ])
            ->where('status', 'pending');

            // For HR/Admin, show all pending leaves
            if ($role === 'hr' || $role === 'admin') {
                // No additional filtering needed
            } else {
                // For regular approvers, show leaves where they are assigned as any approver
                $query->where(function($q) use ($approvalNameIds) {
                    $q->whereIn('leave_credit_authorized_officer_id', $approvalNameIds)
                      ->orWhereIn('recommendation_approver_id', $approvalNameIds)
                      ->orWhereIn('leave_approver_id', $approvalNameIds);
                });
            }

            $leaves = $query->orderBy('created_at', 'desc')->get();

            // Add metadata to each leave indicating current stage and if it's user's turn
            $leaves = $leaves->map(function($leave) use ($user, $role, $approvalNameIds) {
                // Determine current stage
                $currentStage = null;
                $isUserTurn = false;
                
                if (!$leave->leave_credit_officer_approved) {
                    $currentStage = 'leave_credit_officer';
                    // Check if user is the Leave Credit Authorized Officer AND hasn't already approved
                    if ($role === 'hr' || $role === 'admin') {
                        // HR/Admin can approve at any stage
                        $isUserTurn = true;
                    } elseif (in_array($leave->leave_credit_authorized_officer_id, $approvalNameIds)) {
                        // Check if user has already approved at this stage
                        if ($leave->leave_credit_officer_approved_by !== $user->id) {
                            $isUserTurn = true;
                        }
                    }
                } elseif (!$leave->recommendation_approver_approved) {
                    $currentStage = 'recommendation_approver';
                    // Check if user is the Recommendation Approver AND hasn't already approved
                    if ($role === 'hr' || $role === 'admin') {
                        // HR/Admin can approve at any stage
                        $isUserTurn = true;
                    } elseif (in_array($leave->recommendation_approver_id, $approvalNameIds)) {
                        // Check if user has already approved at this stage
                        if ($leave->recommendation_approver_approved_by !== $user->id) {
                            $isUserTurn = true;
                        }
                    }
                } elseif (!$leave->leave_approver_approved) {
                    $currentStage = 'leave_approver';
                    // Check if user is the Leave Approver AND hasn't already approved
                    if ($role === 'hr' || $role === 'admin') {
                        // HR/Admin can approve at any stage
                        $isUserTurn = true;
                    } elseif (in_array($leave->leave_approver_id, $approvalNameIds)) {
                        // Check if user has already approved at this stage
                        if ($leave->leave_approver_approved_by !== $user->id) {
                            $isUserTurn = true;
                        }
                    }
                } else {
                    $currentStage = 'completed';
                    $isUserTurn = false;
                }

                // Add metadata
                $leave->current_stage = $currentStage;
                $leave->is_user_turn = $isUserTurn;
                
                // Determine which approver role the user has for this leave
                $userApproverRole = null;
                if (in_array($leave->leave_credit_authorized_officer_id, $approvalNameIds)) {
                    $userApproverRole = 'leave_credit_officer';
                } elseif (in_array($leave->recommendation_approver_id, $approvalNameIds)) {
                    $userApproverRole = 'recommendation_approver';
                } elseif (in_array($leave->leave_approver_id, $approvalNameIds)) {
                    $userApproverRole = 'leave_approver';
                }
                $leave->user_approver_role = $userApproverRole;

                return $leave;
            });

            // PDS approvals are only for HR/Admin, not for regular approvers
            // Regular approvers (leave approvers) should only see leave applications
            $pds = [];

            return response()->json([
                'leaves' => $leaves,
                'pds' => $pds
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pending approvals: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch pending approvals',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}

