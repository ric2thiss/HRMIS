<?php

namespace App\Http\Controllers;

use App\Models\PersonalDataSheet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PersonalDataSheetController extends Controller
{
    /**
     * Get PDS for current user (employee) or all PDS (HR/Admin)
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $userRole = $user->roles->first()->name ?? null;

        // HR/Admin can see all PDS
        if ($userRole === 'hr' || $userRole === 'admin') {
            $query = PersonalDataSheet::with(['user.roles', 'user.employmentTypes', 'reviewer'])
                ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->has('status') && $request->status !== null && $request->status !== 'all' && $request->status !== '') {
                $query->where('status', $request->status);
            }

            $pds = $query->get();
        } else {
            // Employee can only see their own PDS
            $query = PersonalDataSheet::where('user_id', $user->id)
                ->with(['reviewer'])
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

        return response()->json([
            'message' => 'PDS created successfully',
            'pds' => $pds->load('user')
        ], 201);
    }

    /**
     * Get a specific PDS
     */
    public function show($id)
    {
        $user = auth()->user();
        $userRole = $user->roles->first()->name ?? null;

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

        $pds->form_data = $request->form_data;
        
        // If updating a pending, declined, or approved PDS, reset status to draft
        // This removes it from pending/for approval list
        if ($pds->status === 'pending' || $pds->status === 'declined' || $pds->status === 'approved') {
            $pds->status = 'draft';
            $pds->hr_comments = null;
            // Clear review-related fields when returning to draft
            $pds->submitted_at = null;
            $pds->reviewed_by = null;
            $pds->reviewed_at = null;
            $pds->approved_at = null;
        }
        
        $pds->save();

        return response()->json([
            'message' => 'PDS updated successfully',
            'pds' => $pds->load('user')
        ]);
    }

    /**
     * Submit PDS for approval
     */
    public function submit($id)
    {
        $user = auth()->user();
        $userRole = $user->roles->first()->name ?? null;

        // HR cannot submit PDS (they can only maintain drafts)
        // Admin users can submit PDS like regular employees
        if ($userRole === 'hr') {
            return response()->json([
                'message' => 'HR users cannot submit PDS for approval. Your PDS will remain in draft status for record-keeping.'
            ], 403);
        }

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

        $pds->status = 'pending';
        $pds->submitted_at = now();
        $pds->hr_comments = null; // Clear previous comments
        $pds->save();

        return response()->json([
            'message' => 'PDS submitted for approval',
            'pds' => $pds->load('user')
        ]);
    }

    /**
     * HR Review PDS (approve or decline)
     */
    public function review(Request $request, $id)
    {
        $user = auth()->user();
        $userRole = $user->roles->first()->name ?? null;

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

        $actionMessage = $request->action === 'approve' ? 'approved' : ($request->action === 'for-revision' ? 'sent for revision' : 'declined');
        $notificationMessage = $request->action === 'approve' 
            ? 'Your PDS has been approved!'
            : ($request->action === 'for-revision' 
                ? 'Your PDS has been sent for revision. Please review the comments and update.'
                : 'Your PDS has been declined. Please review the comments and update.');

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
        $userRole = $user->roles->first()->name ?? null;
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
        $userRole = $user->roles->first()->name ?? null;

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
        $userRole = $user->roles->first()->name ?? null;

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
        $userRole = $hrUser->roles->first()->name ?? null;

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
