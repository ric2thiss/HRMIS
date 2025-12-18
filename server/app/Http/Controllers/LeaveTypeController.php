<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    /**
     * Get all leave types
     */
    public function index()
    {
        $leaveTypes = LeaveType::orderBy('name')->get();
        
        return response()->json([
            'leave_types' => $leaveTypes
        ]);
    }

    /**
     * Create a new leave type
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:leave_types,code',
            'name' => 'required|string|max:255',
            'max_days' => 'required|integer|min:0',
            'description' => 'nullable|string',
            'requires_document' => 'nullable|boolean',
            'requires_approval' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $leaveType = LeaveType::create($validated);

        return response()->json([
            'message' => 'Leave type created successfully',
            'leave_type' => $leaveType
        ], 201);
    }

    /**
     * Update a leave type
     */
    public function update(Request $request, $id)
    {
        $leaveType = LeaveType::find($id);

        if (!$leaveType) {
            return response()->json([
                'message' => 'Leave type not found'
            ], 404);
        }

        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:leave_types,code,' . $id,
            'name' => 'required|string|max:255',
            'max_days' => 'required|integer|min:0',
            'description' => 'nullable|string',
            'requires_document' => 'nullable|boolean',
            'requires_approval' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $leaveType->update($validated);

        return response()->json([
            'message' => 'Leave type updated successfully',
            'leave_type' => $leaveType
        ]);
    }

    /**
     * Delete a leave type
     */
    public function destroy($id)
    {
        $leaveType = LeaveType::find($id);

        if (!$leaveType) {
            return response()->json([
                'message' => 'Leave type not found'
            ], 404);
        }

        // Check if leave type is used in any leave applications
        if ($leaveType->leaveApplications()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete leave type. It is used in one or more leave applications.'
            ], 400);
        }

        $leaveType->delete();

        return response()->json([
            'message' => 'Leave type deleted successfully'
        ]);
    }
}

