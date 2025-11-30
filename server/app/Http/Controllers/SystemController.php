<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemMaintenance;

class SystemController extends Controller
{
    public function toggleMaintenance(Request $request)
    {
        // Security check — only HR and admins can toggle maintenance mode
        $user = auth()->user();
        if (!$user->hasRole('admin') && !$user->hasRole('hr')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Ensure the row exists
        $maintenance = SystemMaintenance::firstOrCreate([], [
            'is_enabled' => false,
            'allowed_login_roles' => ['admin', 'hr'], // Default: allow admin and hr
            'message' => 'System is available.',
            'enabled_by' => auth()->id(),
            'started_at' => null,
            'ended_at' => null,
        ]);

        // Update maintenance mode
        $updateData = [
            'is_enabled' => $request->is_enabled ?? $maintenance->is_enabled,
            'message' => $request->message ?? $maintenance->message,
            'enabled_by' => auth()->id(),
        ];

        // Handle allowed_login_roles if provided
        if ($request->has('allowed_login_roles')) {
            $updateData['allowed_login_roles'] = is_array($request->allowed_login_roles) 
                ? $request->allowed_login_roles 
                : json_decode($request->allowed_login_roles, true);
        }

        // Handle timestamps
        $isEnabled = $updateData['is_enabled'];
        $updateData['started_at'] = $isEnabled ? ($maintenance->started_at ?? now()) : $maintenance->started_at;
        $updateData['ended_at'] = $isEnabled ? null : ($maintenance->ended_at ?? now());

        $maintenance->update($updateData);

        return response()->json(['status' => 'updated']);
    }

    public function getMaintenance()
    {
        $maintenance = \App\Models\SystemMaintenance::first();
        
        return response()->json([
            'is_enabled' => $maintenance->is_enabled ?? false,
            'allowed_login_roles' => $maintenance->allowed_login_roles ?? ['admin', 'hr'],
            'message' => $maintenance->message ?? 'System is available.'
        ]);
    }
}
