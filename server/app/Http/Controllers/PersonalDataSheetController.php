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
            $pds = PersonalDataSheet::with(['user', 'reviewer'])
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // Employee can only see their own PDS
            $pds = PersonalDataSheet::where('user_id', $user->id)
                ->with(['reviewer'])
                ->orderBy('created_at', 'desc')
                ->get();
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
     * Update PDS (only if draft or declined)
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

        // Can only update if draft or declined
        if ($pds->status !== 'draft' && $pds->status !== 'declined') {
            return response()->json([
                'message' => 'PDS can only be updated when status is draft or declined'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'form_data' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pds->form_data = $request->form_data;
        
        // If updating a declined PDS, reset status to draft
        if ($pds->status === 'declined') {
            $pds->status = 'draft';
            $pds->hr_comments = null;
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

        // HR and Admin cannot submit PDS (they can only maintain drafts)
        if ($userRole === 'hr' || $userRole === 'admin') {
            return response()->json([
                'message' => 'HR and Admin users cannot submit PDS for approval. Your PDS will remain in draft status for record-keeping.'
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

        // Can only submit if draft or declined
        if ($pds->status !== 'draft' && $pds->status !== 'declined') {
            return response()->json([
                'message' => 'PDS can only be submitted when status is draft or declined'
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
            'action' => 'required|in:approve,decline',
            'comments' => 'required_if:action,decline|nullable|string|max:1000',
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
        } else {
            $pds->status = 'declined';
            $pds->hr_comments = $request->comments;
        }

        $pds->save();

        return response()->json([
            'message' => 'PDS ' . $request->action . 'd successfully',
            'pds' => $pds->load(['user', 'reviewer']),
            'notification' => [
                'type' => $request->action === 'approve' ? 'success' : 'info',
                'message' => $request->action === 'approve' 
                    ? 'Your PDS has been approved!'
                    : 'Your PDS has been declined. Please review the comments and update.'
            ]
        ]);
    }

    /**
     * Delete PDS (only if draft)
     */
    public function destroy($id)
    {
        $user = auth()->user();
        $pds = PersonalDataSheet::find($id);

        if (!$pds) {
            return response()->json(['message' => 'PDS not found'], 404);
        }

        // Employee can only delete their own PDS
        if ($pds->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Can only delete if draft
        if ($pds->status !== 'draft') {
            return response()->json([
                'message' => 'PDS can only be deleted when status is draft'
            ], 400);
        }

        $pds->delete();

        return response()->json(['message' => 'PDS deleted successfully']);
    }

    /**
     * Get employees without PDS (for HR/Admin).
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

        // Get all user IDs who have PDS
        $usersWithPds = PersonalDataSheet::pluck('user_id')->toArray();

        // Filter users without PDS
        $usersWithoutPds = $allUsers->filter(function($user) use ($usersWithPds) {
            return !in_array($user->id, $usersWithPds);
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
