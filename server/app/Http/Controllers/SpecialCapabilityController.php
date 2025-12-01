<?php

namespace App\Http\Controllers;

use App\Models\SpecialCapability;
use Illuminate\Http\Request;

class SpecialCapabilityController extends Controller
{
    /**
     * Get all special capabilities
     */
    public function index()
    {
        $capabilities = SpecialCapability::orderBy('name')->get();
        
        return response()->json([
            'capabilities' => $capabilities
        ]);
    }

    /**
     * Create a new special capability
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:special_capabilities,name',
            'description' => 'nullable|string',
        ]);

        $capability = SpecialCapability::create($validated);

        return response()->json([
            'message' => 'Special capability created successfully',
            'capability' => $capability
        ], 201);
    }

    /**
     * Update a special capability
     */
    public function update(Request $request, $id)
    {
        $capability = SpecialCapability::find($id);

        if (!$capability) {
            return response()->json([
                'message' => 'Special capability not found'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:special_capabilities,name,' . $id,
            'description' => 'nullable|string',
        ]);

        $capability->update($validated);

        return response()->json([
            'message' => 'Special capability updated successfully',
            'capability' => $capability
        ]);
    }

    /**
     * Delete a special capability
     */
    public function destroy($id)
    {
        $capability = SpecialCapability::find($id);

        if (!$capability) {
            return response()->json([
                'message' => 'Special capability not found'
            ], 404);
        }

        $capability->delete();

        return response()->json([
            'message' => 'Special capability deleted successfully'
        ]);
    }
}

