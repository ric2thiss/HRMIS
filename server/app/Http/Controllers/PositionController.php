<?php

namespace App\Http\Controllers;

use App\Models\Position;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    /**
     * Get all positions
     */
    public function index()
    {
        $positions = Position::orderBy('title')->get();
        
        return response()->json([
            'positions' => $positions
        ]);
    }

    /**
     * Create a new position
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $position = Position::create($validated);

        return response()->json([
            'message' => 'Position created successfully',
            'position' => $position
        ], 201);
    }

    /**
     * Update a position
     */
    public function update(Request $request, $id)
    {
        $position = Position::find($id);

        if (!$position) {
            return response()->json([
                'message' => 'Position not found'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $position->update($validated);

        return response()->json([
            'message' => 'Position updated successfully',
            'position' => $position
        ]);
    }

    /**
     * Delete a position
     */
    public function destroy($id)
    {
        $position = Position::find($id);

        if (!$position) {
            return response()->json([
                'message' => 'Position not found'
            ], 404);
        }

        // Check if position is assigned to any users
        if ($position->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete position. It is assigned to one or more users.'
            ], 400);
        }

        $position->delete();

        return response()->json([
            'message' => 'Position deleted successfully'
        ]);
    }
}

