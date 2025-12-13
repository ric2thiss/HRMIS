<?php

namespace App\Http\Controllers;

use App\Models\ApprovalName;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ApprovalNameController extends Controller
{
    /**
     * Display a listing of approval names
     */
    public function index()
    {
        try {
            $approvalNames = ApprovalName::orderBy('sort_order', 'asc')
                ->orderBy('name', 'asc')
                ->get();
            
            return response()->json([
                'approval_names' => $approvalNames
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching approval names: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ' Line: ' . $e->getLine());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'error' => 'Failed to fetch approval names',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred',
                'file' => config('app.debug') ? $e->getFile() . ':' . $e->getLine() : null
            ], 500);
        }
    }

    /**
     * Store a newly created approval name
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:approval_names,name',
            'user_id' => 'required|integer|exists:users,id',
            'type' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $approvalName = ApprovalName::create($validated);

        return response()->json([
            'message' => 'Approval name created successfully',
            'approval_name' => $approvalName
        ], 201);
    }

    /**
     * Update the specified approval name
     */
    public function update(Request $request, $id)
    {
        $approvalName = ApprovalName::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:approval_names,name,' . $id,
            'user_id' => 'nullable|integer|exists:users,id',
            'type' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $approvalName->update($validated);

        return response()->json([
            'message' => 'Approval name updated successfully',
            'approval_name' => $approvalName
        ]);
    }

    /**
     * Remove the specified approval name
     */
    public function destroy($id)
    {
        $approvalName = ApprovalName::findOrFail($id);
        $approvalName->delete();

        return response()->json([
            'message' => 'Approval name deleted successfully'
        ]);
    }

    /**
     * Check if the current user is an approver
     */
    public function checkIfApprover(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'is_approver' => false
                ]);
            }

            $isApprover = ApprovalName::where('user_id', $user->id)
                ->where('is_active', true)
                ->exists();

            return response()->json([
                'is_approver' => $isApprover
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking if user is approver: ' . $e->getMessage());
            return response()->json([
                'is_approver' => false,
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}

