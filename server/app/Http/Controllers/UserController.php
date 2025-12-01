<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function getAllUsers()
    {
        $currentUserId = auth()->id();

        $users = User::where('id', '!=', $currentUserId)
                    ->with(['role', 'position', 'project', 'office', 'roles', 'employmentTypes', 'specialCapabilities'])
                    ->get();

        return response()->json([
            'users' => $users
        ]);
    }

    public function delete($id)
    {
        $user = User::find($id);

        if(!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully.'
        ],200);

    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if(!$user) return response()->json([
            "message" => "User not found."
        ], 404);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_initial' => 'nullable|string|max:10',
            'last_name' => 'required|string|max:255',
            'name' => 'nullable|string|max:255', // Keep for backward compatibility
            'email' => 'required|email|unique:users,email,' . $user->id,
            'position_id' => 'required|exists:positions,id',
            'role_id' => 'required|exists:roles,id',
            'project_id' => 'required|exists:projects,id',
            'office_id' => 'nullable|exists:offices,id',
            'has_system_settings_access' => 'nullable|boolean',
            'special_capability_ids' => 'nullable|array',
            'special_capability_ids.*' => 'exists:special_capabilities,id',
        ]);

        // Build full name from parts
        $fullName = trim($validated['first_name'] . ' ' . 
            ($validated['middle_initial'] ?? '') . ' ' . 
            $validated['last_name']);

        $user->first_name = $validated['first_name'];
        $user->middle_initial = $validated['middle_initial'] ?? null;
        $user->last_name = $validated['last_name'];
        $user->name = $validated['name'] ?? $fullName; // Use provided name or build from parts
        $user->email = $validated['email'];
        $user->position_id = $validated['position_id'];
        $user->role_id = $validated['role_id'];
        $user->project_id = $validated['project_id'];
        $user->office_id = $validated['office_id'] ?? null;
        
        // Only admin can grant/revoke system settings access
        $currentUser = auth()->user();
        if ($currentUser && $currentUser->hasRole('admin') && isset($validated['has_system_settings_access'])) {
            $user->has_system_settings_access = $validated['has_system_settings_access'];
        }
        
        // Update many-to-many role relationship (backward compatibility)
        $user->roles()->sync([$validated['role_id']]);
        
        // Update special capabilities (only for JO employees, but we allow it for all)
        if (isset($validated['special_capability_ids'])) {
            $user->specialCapabilities()->sync($validated['special_capability_ids']);
        } else {
            // If not provided, clear all special capabilities
            $user->specialCapabilities()->detach();
        }

        $user->save();

        return response()->json([
            "message" => "Updated Successfully",
            'user' => $user->load(['role', 'position', 'project', 'office', 'roles', 'employmentTypes', 'specialCapabilities'])
        ]);
    }

    /**
     * Toggle system settings access for HR user (Admin only)
     */
    public function toggleSystemSettingsAccess(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        // Only allow for HR users
        $userRole = $user->role;
        if (!$userRole || $userRole->name !== 'hr') {
            return response()->json([
                'message' => 'System settings access can only be granted to HR users.'
            ], 400);
        }

        $validated = $request->validate([
            'has_system_settings_access' => 'required|boolean',
        ]);

        $user->has_system_settings_access = $validated['has_system_settings_access'];
        $user->save();

        return response()->json([
            'message' => $validated['has_system_settings_access'] 
                ? 'System settings access granted successfully' 
                : 'System settings access revoked successfully',
            'user' => $user->load(['role', 'position', 'project', 'office', 'roles', 'employmentTypes', 'specialCapabilities'])
        ]);
    }

}
