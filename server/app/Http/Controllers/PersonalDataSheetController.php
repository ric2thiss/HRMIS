<?php

namespace App\Http\Controllers;

use App\Models\PersonalDataSheet;
use App\Services\WebSocketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PersonalDataSheetController extends Controller
{
    /**
     * Get PDS for current user (employee) or all PDS (HR/Admin)
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        // Eager load roles to avoid N+1 query
        $user->load('roles');
        $userRole = $user->roles->first()?->name ?? null;

        // HR/Admin can see all PDS
        if ($userRole === 'hr' || $userRole === 'admin') {
            $query = PersonalDataSheet::with([
                'user:id,name,first_name,last_name,employee_id,email',
                'user.roles:id,name',
                'user.employmentTypes:id,name',
                'reviewer:id,name,first_name,last_name'
            ])
                ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->has('status') && $request->status !== null && $request->status !== 'all' && $request->status !== '') {
                $query->where('status', $request->status);
            }

            $pds = $query->get();
        } else {
            // Employee can only see their own PDS
            $query = PersonalDataSheet::where('user_id', $user->id)
                ->with(['reviewer:id,name,first_name,last_name'])
                ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->has('status') && $request->status !== null && $request->status !== 'all' && $request->status !== '') {
                $query->where('status', $request->status);
            }

            $pds = $query->get();
        }

        return response()->json(['pds' => $pds]);
    }

    /**
     * Get current user's PDS (for checking if exists)
     */
    public function myPds()
    {
        $user = auth()->user();

        $pds = PersonalDataSheet::where('user_id', $user->id)
            ->with(['reviewer'])
            ->first();

        return response()->json(['pds' => $pds]);
    }

    /**
     * Create a new PDS (draft)
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        // Check if user already has a PDS
        $existingPds = PersonalDataSheet::where('user_id', $user->id)->first();
        if ($existingPds) {
            return response()->json([
                'message' => 'You already have a PDS. Please update the existing one.',
                'pds' => $existingPds
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'form_data' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pds = PersonalDataSheet::create([
            'user_id' => $user->id,
            'form_data' => $request->form_data,
            'status' => 'draft',
        ]);

        $pds->load('user');

        // Emit WebSocket event for PDS creation (HR can see new drafts)
        try {
            $websocketService = new WebSocketService();
            $websocketService->emitUpdate('pds', 'created', [
                'pds' => $pds->toArray(),
            ], ['type' => 'role', 'role' => 'hr']);
        } catch (\Exception $e) {
            Log::warning('Failed to emit WebSocket event for PDS creation: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'PDS created successfully',
            'pds' => $pds
        ], 201);
    }

    /**
     * Get a specific PDS
     */
    public function show($id)
    {
        $user = auth()->user();
        // Eager load roles to avoid N+1 query
        $user->load('roles');
        $userRole = $user->roles->first()?->name ?? null;

        $pds = PersonalDataSheet::with(['user', 'reviewer'])->find($id);

        if (!$pds) {
            return response()->json(['message' => 'PDS not found'], 404);
        }

        // Employee can only view their own PDS
        if ($userRole !== 'hr' && $userRole !== 'admin' && $pds->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['pds' => $pds]);
    }

    /**
     * Update PDS (draft, declined, approved, or pending)
     * When updating pending PDS, status changes to draft and removes from pending list
     */
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $pds = PersonalDataSheet::find($id);

        if (!$pds) {
            return response()->json(['message' => 'PDS not found'], 404);
        }

        // Employee can only update their own PDS
        if ($pds->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Can update if draft, declined, approved, or pending
        // When updating pending/declined/approved PDS, reset status to draft
        if ($pds->status !== 'draft' && $pds->status !== 'declined' && $pds->status !== 'approved' && $pds->status !== 'pending') {
            return response()->json([
                'message' => 'PDS can only be updated when status is draft, pending, declined, or approved'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'form_data' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $oldStatus = $pds->status;
        $pds->form_data = $request->form_data;
        
        // If updating a pending, declined, or approved PDS, reset status to draft
        // This removes it from pending/for approval list
        $statusChanged = false;
        if ($pds->status === 'pending' || $pds->status === 'declined' || $pds->status === 'approved') {
            $pds->status = 'draft';
            $pds->hr_comments = null;
            // Clear review-related fields when returning to draft
            $pds->submitted_at = null;
            $pds->reviewed_by = null;
            $pds->reviewed_at = null;
            $pds->approved_at = null;
            $statusChanged = true;
        }
        
        $pds->save();
        $pds->load('user');

        // Notify HR if PDS was removed from pending/approval list
        if ($statusChanged && $oldStatus === 'pending') {
            try {
                $websocketService = new WebSocketService();
                
                // Get employee name for notification
                $employeeName = $pds->user->first_name . ' ' . $pds->user->last_name;
                if (empty(trim($employeeName))) {
                    $employeeName = $pds->user->name;
                }
                
                // Notify HR that PDS was updated and removed from pending
                $websocketService->notifyRole('hr', [
                    'type' => 'warning',
                    'title' => 'PDS Updated',
                    'message' => $employeeName . ' has updated their PDS. It has been removed from the approval queue.',
                    'entity_type' => 'pds',
                    'entity_id' => $pds->id,
                    'data' => [
                        'pds_id' => $pds->id,
                        'user_id' => $pds->user_id,
                        'employee_name' => $employeeName,
                        'old_status' => $oldStatus,
                        'new_status' => 'draft',
                    ]
                ]);
                
                // Emit PDS update event for real-time UI updates
                $websocketService->emitUpdate('pds', 'updated', [
                    'pds' => $pds->toArray(),
                    'old_status' => $oldStatus,
                    'new_status' => 'draft',
                ], ['type' => 'role', 'role' => 'hr']);
            } catch (\Exception $e) {
                Log::warning('Failed to send WebSocket notification for PDS update: ' . $e->getMessage());
            }
        } else if ($statusChanged) {
            // PDS status changed (not from pending), still notify HR
            try {
                $websocketService = new WebSocketService();
                
                // Emit PDS update event for real-time UI updates
                $websocketService->emitUpdate('pds', 'updated', [
                    'pds' => $pds->toArray(),
                    'old_status' => $oldStatus,
                    'new_status' => 'draft',
                ], ['type' => 'role', 'role' => 'hr']);
            } catch (\Exception $e) {
                Log::warning('Failed to emit WebSocket event for PDS update: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'PDS updated successfully',
            'pds' => $pds
        ]);
    }

    /**
     * Submit PDS for approval
     */
    public function submit($id)
    {
        $user = auth()->user();
        // Eager load roles to avoid N+1 query
        $user->load('roles');
        $userRole = $user->roles->first()?->name ?? null;

        // HR and Admin users can submit PDS like regular employees
        // (Previously HR could not submit, but now allowed per requirements)

        $pds = PersonalDataSheet::find($id);

        if (!$pds) {
            return response()->json(['message' => 'PDS not found'], 404);
        }

        // Employee can only submit their own PDS
        if ($pds->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Can only submit if draft, declined, or for-revision
        if ($pds->status !== 'draft' && $pds->status !== 'declined' && $pds->status !== 'for-revision') {
            return response()->json([
                'message' => 'PDS can only be submitted when status is draft, declined, or for-revision'
            ], 400);
        }

        // Prevent duplicate submissions - check if already pending and submitted recently
        $wasAlreadyPending = $pds->status === 'pending';
        $recentlySubmitted = $pds->submitted_at && $pds->submitted_at->isAfter(now()->subMinutes(5));
        
        // Skip notification if this was already pending and submitted recently (prevent duplicates)
        if ($wasAlreadyPending && $recentlySubmitted) {
            return response()->json([
                'message' => 'PDS already submitted',
                'pds' => $pds->load('user')
            ]);
        }

        $oldStatus = $pds->status;
        $pds->status = 'pending';
        $pds->submitted_at = now();
        $pds->hr_comments = null; // Clear previous comments
        $pds->save();
        
        $pds->load('user');

        // Notify all HR users about new PDS submission
        try {
            $websocketService = new WebSocketService();
            
            // Get employee name for notification
            $employeeName = $pds->user->first_name . ' ' . $pds->user->last_name;
            if (empty(trim($employeeName))) {
                $employeeName = $pds->user->name;
            }
            
            // Notify HR role (exclude the submitter from receiving this notification)
            $websocketService->notifyRole('hr', [
                'type' => 'info',
                'title' => 'New PDS Submitted',
                'message' => $employeeName . ' has submitted a PDS for approval.',
                'entity_type' => 'pds',
                'entity_id' => $pds->id,
                'data' => [
                    'pds_id' => $pds->id,
                    'user_id' => $pds->user_id,
                    'employee_name' => $employeeName,
                    'status' => 'pending',
                    'action_by_user_id' => $pds->user_id, // Track who performed the action
                ]
            ]);
            
            // Also emit PDS update event for real-time UI updates
            $websocketService->emitUpdate('pds', 'submitted', [
                'pds' => $pds->toArray(),
                'old_status' => $oldStatus,
                'new_status' => 'pending',
            ], ['type' => 'role', 'role' => 'hr']);
        } catch (\Exception $e) {
            Log::warning('Failed to send WebSocket notification for PDS submission: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'PDS submitted for approval',
            'pds' => $pds
        ]);
    }

    /**
     * HR Review PDS (approve or decline)
     */
    public function review(Request $request, $id)
    {
        $user = auth()->user();
        // Eager load roles to avoid N+1 query
        $user->load('roles');
        $userRole = $user->roles->first()?->name ?? null;

        // Only HR and Admin can review
        if ($userRole !== 'hr' && $userRole !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pds = PersonalDataSheet::find($id);

        if (!$pds) {
            return response()->json(['message' => 'PDS not found'], 404);
        }

        // Can only review pending PDS
        if ($pds->status !== 'pending') {
            return response()->json([
                'message' => 'PDS can only be reviewed when status is pending'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,decline,for-revision',
            'comments' => 'required_if:action,decline|required_if:action,for-revision|nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $pds->reviewed_by = $user->id;
        $pds->reviewed_at = now();

        if ($request->action === 'approve') {
            $pds->status = 'approved';
            $pds->approved_at = now();
            $pds->hr_comments = null;
            
            // TODO: Send notification to user (email/push notification)
            // For now, the frontend will handle showing success message
        } elseif ($request->action === 'for-revision') {
            $pds->status = 'for-revision';
            $pds->hr_comments = $request->comments;
        } else {
            $pds->status = 'declined';
            $pds->hr_comments = $request->comments;
        }

        $pds->save();
        $pds->load('user');

        $actionMessage = $request->action === 'approve' ? 'approved' : ($request->action === 'for-revision' ? 'sent for revision' : 'declined');
        $notificationMessage = $request->action === 'approve' 
            ? 'Your PDS has been approved!'
            : ($request->action === 'for-revision' 
                ? 'Your PDS has been sent for revision. Please review the comments and update.'
                : 'Your PDS has been declined. Please review the comments and update.');

        // Send real-time notification to the PDS owner
        try {
            $websocketService = new WebSocketService();
            $websocketService->notifyUser($pds->user_id, [
                'type' => $request->action === 'approve' ? 'success' : 'info',
                'title' => 'PDS Update',
                'message' => $notificationMessage,
                'entity_type' => 'pds',
                'entity_id' => $pds->id,
                'data' => [
                    'pds_id' => $pds->id,
                    'action' => $request->action,
                ]
            ]);
            
            // Emit PDS update event for real-time UI updates (HR sees status change)
            // This removes the PDS from pending list immediately
            $websocketService->emitUpdate('pds', 'reviewed', [
                'pds' => $pds->toArray(),
                'action' => $request->action,
                'old_status' => 'pending',
                'new_status' => $pds->status,
            ], ['type' => 'role', 'role' => 'hr']);
        } catch (\Exception $e) {
            Log::warning('Failed to send WebSocket notification for PDS review: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'PDS ' . $actionMessage . ' successfully',
            'pds' => $pds->load(['user', 'reviewer']),
            'notification' => [
                'type' => $request->action === 'approve' ? 'success' : 'info',
                'message' => $notificationMessage
            ]
        ]);
    }

    /**
     * Delete PDS
     * - Employees can only delete their own draft PDS
     * - HR/Admin can delete any PDS
     */
    public function destroy($id)
    {
        $user = auth()->user();
        // Eager load roles to avoid N+1 query
        $user->load('roles');
        $userRole = $user->roles->first()?->name ?? null;
        $pds = PersonalDataSheet::find($id);

        if (!$pds) {
            return response()->json(['message' => 'PDS not found'], 404);
        }

        // Employee can only delete their own PDS and only if draft
        if ($userRole !== 'hr' && $userRole !== 'admin') {
            if ($pds->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            if ($pds->status !== 'draft') {
                return response()->json([
                    'message' => 'PDS can only be deleted when status is draft'
                ], 400);
            }
        }
        // HR/Admin can delete any PDS regardless of status

        $pds->delete();

        return response()->json(['message' => 'PDS deleted successfully']);
    }

    /**
     * Return PDS to owner (HR/Admin only)
     * Changes status back to draft so employee can update
     */
    public function returnToOwner($id)
    {
        $user = auth()->user();
        // Eager load roles to avoid N+1 query
        $user->load('roles');
        $userRole = $user->roles->first()?->name ?? null;

        // Only HR and Admin can return PDS
        if ($userRole !== 'hr' && $userRole !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pds = PersonalDataSheet::find($id);

        if (!$pds) {
            return response()->json(['message' => 'PDS not found'], 404);
        }

        // Reset PDS to draft status
        $pds->status = 'draft';
        $pds->submitted_at = null;
        $pds->reviewed_by = null;
        $pds->reviewed_at = null;
        $pds->approved_at = null;
        $pds->hr_comments = null;
        $pds->save();

        return response()->json([
            'message' => 'PDS returned to owner successfully. Employee can now update it.',
            'pds' => $pds->load(['user', 'reviewer'])
        ]);
    }

    /**
     * Get employees without PDS (for HR/Admin).
     * Returns users who have not created any PDS or have empty form_data.
     */
    public function employeesWithoutPds()
    {
        $user = auth()->user();
        // Eager load roles to avoid N+1 query
        $user->load('roles');
        $userRole = $user->roles->first()?->name ?? null;

        if ($userRole !== 'hr' && $userRole !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get all users who are not HR/Admin
        $allUsers = \App\Models\User::with(['roles', 'employmentTypes'])
            ->whereHas('roles', function($q) {
                $q->whereNotIn('name', ['hr', 'admin']);
            })
            ->get();

        // Get all user IDs who have PDS with actual data entered
        // A PDS has data if form_data is not null and contains at least one non-empty field
        $allPds = PersonalDataSheet::whereNotNull('form_data')->get();
        $usersWithPdsData = [];
        
        foreach ($allPds as $pds) {
            $formData = $pds->form_data;
            // form_data is cast as array, so it will be an array or null
            if (is_array($formData) && !empty($formData)) {
                // Check if there's at least one non-empty field value
                $hasData = false;
                foreach ($formData as $key => $value) {
                    // Skip empty strings, null, false, and empty arrays
                    if (!empty($value) && $value !== null && $value !== '' && $value !== false) {
                        // If it's an array, check if it has any non-empty values
                        if (is_array($value)) {
                            foreach ($value as $item) {
                                if (!empty($item) && $item !== null && $item !== '') {
                                    $hasData = true;
                                    break 2; // Break both loops
                                }
                            }
                        } else {
                            $hasData = true;
                            break;
                        }
                    }
                }
                if ($hasData) {
                    $usersWithPdsData[] = $pds->user_id;
                }
            }
        }
        
        $usersWithPdsData = array_unique($usersWithPdsData);

        // Filter users without PDS data
        $usersWithoutPds = $allUsers->filter(function($user) use ($usersWithPdsData) {
            return !in_array($user->id, $usersWithPdsData);
        })->values();

        return response()->json(['employees' => $usersWithoutPds]);
    }

    /**
     * Send notification to employee to fill PDS (for HR/Admin).
     */
    public function notifyEmployee(Request $request, $userId)
    {
        $hrUser = auth()->user();
        // Eager load roles to avoid N+1 query
        $hrUser->load('roles');
        $userRole = $hrUser->roles->first()?->name ?? null;

        if ($userRole !== 'hr' && $userRole !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = \App\Models\User::with(['roles', 'employmentTypes'])->find($userId);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        // Check if employee is HR/Admin (they don't need to fill PDS)
        if ($employee->hasRole('hr') || $employee->hasRole('admin')) {
            return response()->json(['message' => 'HR and Admin users do not need to fill PDS'], 400);
        }

        // TODO: Send email/notification to employee
        // For now, just log it
        \Illuminate\Support\Facades\Log::info("HR {$hrUser->name} sent PDS reminder to {$employee->name} ({$employee->email})");

        return response()->json([
            'message' => 'Notification sent to employee successfully',
            'employee' => $employee
        ]);
    }
}
