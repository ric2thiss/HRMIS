<?php

namespace App\Http\Controllers;

use App\Models\Office;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    /**
     * Get all offices
     */
    public function index()
    {
        $offices = Office::orderBy('name')->get();
        
        return response()->json([
            'offices' => $offices
        ]);
    }

    /**
     * Create a new office
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:offices,code',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:500',
            'contact_person' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive',
        ]);

        $office = Office::create($validated);

        return response()->json([
            'message' => 'Office created successfully',
            'office' => $office
        ], 201);
    }

    /**
     * Update an office
     */
    public function update(Request $request, $id)
    {
        $office = Office::find($id);

        if (!$office) {
            return response()->json([
                'message' => 'Office not found'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:offices,code,' . $id,
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:500',
            'contact_person' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive',
        ]);

        $office->update($validated);

        return response()->json([
            'message' => 'Office updated successfully',
            'office' => $office
        ]);
    }

    /**
     * Delete an office
     */
    public function destroy($id)
    {
        $office = Office::find($id);

        if (!$office) {
            return response()->json([
                'message' => 'Office not found'
            ], 404);
        }

        // Check if office is assigned to any users
        if ($office->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete office. It is assigned to one or more users.'
            ], 400);
        }

        $office->delete();

        return response()->json([
            'message' => 'Office deleted successfully'
        ]);
    }
}
