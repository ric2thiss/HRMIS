<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
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
        $createData = [
            'is_enabled' => false,
            'allowed_login_roles' => ['admin', 'hr'], // Default: allow admin and hr
            'message' => 'System is available.',
            'enabled_by' => auth()->id(),
            'started_at' => null,
            'ended_at' => null,
        ];
        
        // Only add version if column exists
        if (Schema::hasColumn('system_maintenance', 'version')) {
            $createData['version'] = '1.0.0';
        }
        
        $maintenance = SystemMaintenance::firstOrCreate([], $createData);

        // Update maintenance mode
        $updateData = [
            'is_enabled' => $request->is_enabled ?? $maintenance->is_enabled,
            'message' => $request->message ?? $maintenance->message,
            'enabled_by' => auth()->id(),
        ];
        
        // Only update version if column exists and value is provided
        if ($request->has('version') && Schema::hasColumn('system_maintenance', 'version')) {
            $updateData['version'] = $request->version ?? ($maintenance->version ?? '1.0.0');
        }

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
        
        // Safely get version - handle case where column doesn't exist yet
        $version = '1.0.0';
        if ($maintenance && Schema::hasColumn('system_maintenance', 'version')) {
            $version = $maintenance->version ?? '1.0.0';
        }
        
        return response()->json([
            'is_enabled' => $maintenance->is_enabled ?? false,
            'allowed_login_roles' => $maintenance->allowed_login_roles ?? ['admin', 'hr'],
            'message' => $maintenance->message ?? 'System is available.',
            'version' => $version
        ]);
    }

    /**
     * Update system version (HR and Admin only)
     */
    public function updateVersion(Request $request)
    {
        // Security check — only HR and admins can update version
        $user = auth()->user();
        if (!$user->hasRole('admin') && !$user->hasRole('hr')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'version' => 'required|string|max:50',
        ]);

        // Check if version column exists
        try {
            // Try to check if column exists by querying schema
            $hasVersionColumn = \Illuminate\Support\Facades\Schema::hasColumn('system_maintenance', 'version');
            
            if (!$hasVersionColumn) {
                return response()->json([
                    'message' => 'Version column does not exist. Please run the migration first.',
                    'error' => 'Migration required: php artisan migrate'
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error checking database schema',
                'error' => $e->getMessage()
            ], 500);
        }

        // Ensure the row exists
        $createData = [
            'is_enabled' => false,
            'allowed_login_roles' => ['admin', 'hr'],
            'message' => 'System is available.',
            'enabled_by' => auth()->id(),
            'started_at' => null,
            'ended_at' => null,
        ];
        
        // Add version to create data only if column exists
        if (Schema::hasColumn('system_maintenance', 'version')) {
            $createData['version'] = '1.0.0';
        }
        
        $maintenance = SystemMaintenance::firstOrCreate([], $createData);

        try {
            $maintenance->update(['version' => $validated['version']]);
            
            return response()->json([
                'message' => 'Version updated successfully',
                'version' => $maintenance->version
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update version',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get system version (public endpoint)
     */
    public function getVersion()
    {
        try {
            // Check if version column exists first
            $hasVersionColumn = false;
            try {
                $hasVersionColumn = Schema::hasColumn('system_maintenance', 'version');
            } catch (\Exception $e) {
                // If schema check fails, assume column doesn't exist
                $hasVersionColumn = false;
            }
            
            $maintenance = SystemMaintenance::first();
            
            // Get version if column exists and maintenance record exists
            if ($hasVersionColumn && $maintenance) {
                try {
                    $version = $maintenance->version ?? '1.0.0';
                } catch (\Exception $e) {
                    // If accessing version fails, use default
                    $version = '1.0.0';
                }
            } else {
                $version = '1.0.0';
            }
            
            return response()->json([
                'version' => $version
            ]);
        } catch (\Exception $e) {
            // If any error occurs, return default version
            return response()->json([
                'version' => '1.0.0'
            ]);
        }
    }
}
