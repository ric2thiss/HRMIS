<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemMaintenance;

class SystemController extends Controller
{
    public function toggleMaintenance(Request $request)
    {
        // Security check — only admins can toggle maintenance mode
        if (!auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Ensure the row exists
        $maintenance = SystemMaintenance::firstOrCreate([], [
            'is_enabled' => false,
            'message' => 'System is available.',
            'enabled_by' => auth()->id(),
            'started_at' => null,
            'ended_at' => null,
        ]);

        // Update maintenance mode
        $maintenance->update([
            'is_enabled' => $request->is_enabled,
            'message' => $request->message,
            'enabled_by' => auth()->id(),
            'started_at' => $request->is_enabled ? now() : $maintenance->started_at,
            'ended_at' => $request->is_enabled ? null : now(),
        ]);

        return response()->json(['status' => 'updated']);
    }

    public function getMaintenance()
    {
        $maintenance = \App\Models\SystemMaintenance::first();
        
        return response()->json([
            'is_enabled' => $maintenance->is_enabled ?? false,
            'message' => $maintenance->message ?? 'System is available.'
        ]);
    }
}
