<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        // Validate input
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_initial' => 'nullable|string|max:10',
            'last_name' => 'required|string|max:255',
            'name' => 'nullable|string|max:255', // Keep for backward compatibility
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6',
            'position_id' => 'required|exists:positions,id',
            'role_id' => 'required|exists:roles,id',
            'project_id' => 'required|exists:projects,id',
            'office_id' => 'nullable|exists:offices,id',
            'employment_type_id' => 'required|exists:employment_type,id',
            'special_capability_ids' => 'nullable|array',
            'special_capability_ids.*' => 'exists:special_capabilities,id',
        ]);

        // Generate employee_id: [employment_type_id][year][month][incremental]
        $year = date('Y');
        $month = date('m');

        // Get last user's ID to increment
        $lastId = User::max('id') ?? 0;
        $increment = str_pad($lastId + 1, 4, '0', STR_PAD_LEFT); // zero-padded to 4 digits

        $employeeId = $validated['employment_type_id'] . $year . $month . $increment;

        // Build full name from parts
        $fullName = trim($validated['first_name'] . ' ' . 
            ($validated['middle_initial'] ?? '') . ' ' . 
            $validated['last_name']);

        // Create the user with new foreign keys
        $user = User::create([
            'employee_id' => $employeeId,
            'first_name' => $validated['first_name'],
            'middle_initial' => $validated['middle_initial'] ?? null,
            'last_name' => $validated['last_name'],
            'name' => $validated['name'] ?? $fullName, // Use provided name or build from parts
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'position_id' => $validated['position_id'],
            'role_id' => $validated['role_id'],
            'project_id' => $validated['project_id'],
            'office_id' => $validated['office_id'] ?? null,
        ]);

        // Attach role (maintain backward compatibility with many-to-many)
        $user->roles()->attach((int) $validated['role_id']);

        // Attach employment type via pivot table
        $user->employmentTypes()->attach((int) $validated['employment_type_id']);

        // Attach special capabilities if provided (for JO employees)
        if (isset($validated['special_capability_ids']) && !empty($validated['special_capability_ids'])) {
            $user->specialCapabilities()->attach($validated['special_capability_ids']);
        }

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user->load(['role', 'position', 'project', 'office', 'roles', 'employmentTypes', 'specialCapabilities'])
        ], 201);
    }


    // LOGIN
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Regenerate session for security after successful login
        $request->session()->regenerate();

        $user = auth()->user();
        
        // Safely load relationships - handle cases where foreign keys might be null
        try {
            $user->load(['role', 'position', 'project', 'office', 'roles', 'employmentTypes', 'specialCapabilities']);
        } catch (\Exception $e) {
            // If relationships fail to load, just load the basic ones
            $user->load(['roles', 'employmentTypes']);
        }
        
        return response()->json([
            'message' => "Successfully logged in!",
            'user' => $user
        ]);
    }

    // LOGOUT
    public function logout(Request $request)
    {
       // Log out the user
        Auth::guard('web')->logout();

        // Invalidate the session
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Return response
       return response()->json(['message' => 'Logged out'], 200)
        ->withCookie(cookie()->forget('laravel_session'))
        ->withCookie(cookie()->forget('XSRF-TOKEN'));

    }

    // PROFILE (Protected)
    public function profile(Request $request)
    {
        $user = $request->user();
        
        // Safely load relationships
        try {
            $user->load(['role', 'position', 'project', 'office', 'roles', 'employmentTypes', 'specialCapabilities']);
        } catch (\Exception $e) {
            $user->load(['roles', 'employmentTypes']);
        }
        
        return response()->json($user);
    }

    // LOGOUT FROM ALL DEVICES
    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out from all devices'
        ], 200)->cookie(
            'token',
            '',
            -1,
            '/',
            null,
            false,
            true
        );
    }

    // RETURN AUTH USER
    public function user(Request $request)
    {
        $user = $request->user();
        
        // Safely load relationships
        try {
            $user->load(['role', 'position', 'project', 'roles', 'employmentTypes', 'specialCapabilities']);
        } catch (\Exception $e) {
            $user->load(['roles', 'employmentTypes']);
        }
        
        return response()->json([
            'user' => $user
        ], 200);
    }

    // UPDATE PROFILE (for current user)
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'middle_initial' => 'nullable|string|max:10',
            'last_name' => 'sometimes|required|string|max:255',
            'name' => 'nullable|string|max:255', // Keep for backward compatibility
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|nullable|string|min:6',
            'current_password' => 'required_with:password|string',
            'profile_image' => 'sometimes|nullable|string', // Base64 encoded image
        ]);

        // Update name fields if provided
        if (isset($validated['first_name'])) {
            $user->first_name = $validated['first_name'];
        }
        if (isset($validated['middle_initial'])) {
            $user->middle_initial = $validated['middle_initial'];
        }
        if (isset($validated['last_name'])) {
            $user->last_name = $validated['last_name'];
        }
        // Build full name from parts if name parts are provided
        if (isset($validated['first_name']) || isset($validated['last_name'])) {
            $fullName = trim(($user->first_name ?? '') . ' ' . 
                ($user->middle_initial ?? '') . ' ' . 
                ($user->last_name ?? ''));
            $user->name = $validated['name'] ?? $fullName;
        } elseif (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        // Update email if provided
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        // Update password if provided
        if (isset($validated['password'])) {
            // Verify current password
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Current password is incorrect'
                ], 422);
            }
            $user->password = Hash::make($validated['password']);
        }

        // Update profile image if provided
        if (isset($validated['profile_image'])) {
            $user->profile_image = $validated['profile_image']; // Store base64 string
        }

        $user->save();

        // Safely load relationships
        try {
            $user->load(['role', 'position', 'project', 'office', 'roles', 'employmentTypes', 'specialCapabilities']);
        } catch (\Exception $e) {
            $user->load(['roles', 'employmentTypes']);
        }
        
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }
}
    