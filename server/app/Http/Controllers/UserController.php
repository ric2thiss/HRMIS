<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function getAllUsers()
    {
        $currentUserId = auth()->id();

        // Only load necessary fields and relationships to reduce payload
        // Include profile_image and other fields needed by frontend
        $users = User::where('id', '!=', $currentUserId)
                    ->select('id', 'employee_id', 'first_name', 'middle_initial', 'last_name', 'name', 'email', 'profile_image', 'position_id', 'role_id', 'project_id', 'office_id', 'is_locked', 'has_system_settings_access', 'created_at', 'updated_at')
                    ->with([
                        'role:id,name',
                        'position:id,title',
                        'project:id,name,project_code,status',
                        'office:id,name,code',
                        'roles:id,name',
                        'employmentTypes:id,name',
                        'specialCapabilities:id,name'
                    ])
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
            'sex' => 'nullable|in:Male,Female',
            'name' => 'nullable|string|max:255', // Keep for backward compatibility
            'email' => 'required|email|unique:users,email,' . $user->id,
            'position_id' => 'required|exists:positions,id',
            'role_id' => 'required|exists:roles,id',
            'project_id' => 'required|exists:projects,id',
            'office_id' => 'nullable|exists:offices,id',
            'has_system_settings_access' => 'nullable|boolean',
            'employment_type_id' => 'nullable|exists:employment_type,id',
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
        if (isset($validated['sex'])) {
            $user->sex = $validated['sex'];
        }
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
        
        // Update employment type if provided
        if (isset($validated['employment_type_id'])) {
            $employmentTypeId = $validated['employment_type_id'];
            
            // Get current employment type before update
            $currentEmploymentType = $user->employmentTypes()->first();
            $newEmploymentType = \App\Models\Employment::find($employmentTypeId);
            
            // Check if employment type is actually changing
            if ($currentEmploymentType && $newEmploymentType && $currentEmploymentType->id !== $newEmploymentType->id) {
                // Employment type is changing, update employee ID
                // Get the new employment type code
                $newEmploymentTypeCode = '1'; // Default to Plantilla
                if (strtolower($newEmploymentType->name) === 'jo' || $newEmploymentType->name === 'JO') {
                    $newEmploymentTypeCode = '2';
                }
                
                // Extract year, month, and increment from current employee_id
                // Format: [code][year][month][increment] e.g., 22025120016 (11 digits total)
                $currentEmployeeId = $user->employee_id;
                if ($currentEmployeeId && strlen($currentEmployeeId) >= 11) {
                    // Extract parts: first digit is old code, next 4 are year, next 2 are month, last 4 are increment
                    $year = substr($currentEmployeeId, 1, 4); // e.g., 2025
                    $month = substr($currentEmployeeId, 5, 2); // e.g., 12
                    $increment = substr($currentEmployeeId, 7, 4); // e.g., 0016 (ensure we only take 4 digits)
                    
                    // Generate new employee ID with new employment type code
                    $newEmployeeId = $newEmploymentTypeCode . $year . $month . $increment;
                    
                    // Check if the new employee ID already exists (excluding current user)
                    $existingUser = User::where('employee_id', $newEmployeeId)
                        ->where('id', '!=', $user->id)
                        ->first();
                    
                    if ($existingUser) {
                        // If ID exists, generate a new increment
                        // Find the highest increment for this employment type + year + month combination
                        $pattern = $newEmploymentTypeCode . $year . $month . '%';
                        $maxEmployeeId = User::where('employee_id', 'like', $pattern)
                            ->where('id', '!=', $user->id)
                            ->orderBy('employee_id', 'desc')
                            ->value('employee_id');
                        
                        if ($maxEmployeeId) {
                            // Extract increment from max ID and add 1
                            $maxIncrement = (int) substr($maxEmployeeId, 7);
                            $newIncrement = str_pad($maxIncrement + 1, 4, '0', STR_PAD_LEFT);
                        } else {
                            // No existing IDs with this pattern, use increment 0001
                            $newIncrement = '0001';
                        }
                        
                        $newEmployeeId = $newEmploymentTypeCode . $year . $month . $newIncrement;
                    }
                    
                    // Update the employee ID
                    $user->employee_id = $newEmployeeId;
                }
            }
            
            $user->employmentTypes()->sync([$employmentTypeId]);
        }
        
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
            'user' => $user->load([
                'role:id,name',
                'position:id,title',
                'project:id,name,project_code,status',
                'office:id,name',
                'roles:id,name',
                'employmentTypes:id,name',
                'specialCapabilities:id,name'
            ])
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
            'user' => $user->load([
                'role:id,name',
                'position:id,title',
                'project:id,name,project_code,status',
                'office:id,name',
                'roles:id,name',
                'employmentTypes:id,name',
                'specialCapabilities:id,name'
            ])
        ]);
    }

    /**
     * Toggle account lock status (HR only)
     */
    public function toggleLock(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        // Prevent locking yourself
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot lock your own account.'
            ], 400);
        }

        $validated = $request->validate([
            'is_locked' => 'required|boolean',
        ]);

        $user->is_locked = $validated['is_locked'];
        $user->save();

        // If locking, invalidate all user's tokens to force logout
        if ($validated['is_locked']) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $validated['is_locked'] 
                ? 'Account locked successfully' 
                : 'Account unlocked successfully',
            'user' => $user->load([
                'role:id,name',
                'position:id,title',
                'project:id,name,project_code,status',
                'office:id,name',
                'roles:id,name',
                'employmentTypes:id,name',
                'specialCapabilities:id,name'
            ])
        ]);
    }

}
