<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use App\Models\User;
use App\Models\LoginActivity;
use App\Models\Office;

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
            'sex' => 'required|in:Male,Female',
            'name' => 'nullable|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6',
            'position_id' => 'required|exists:positions,id',
            'role_id' => 'required|exists:roles,id',
            'project_id' => 'required|exists:projects,id',
            'office_id' => 'nullable|exists:offices,id',
            'employment_type_id' => 'required|exists:employment_type,id',
            'special_capability_ids' => 'nullable|array',
            'special_capability_ids.*' => 'required_with:special_capability_ids|exists:special_capabilities,id',
        ]);

        // Determine final employment type (enforce Plantilla for HR/Admin)
        $selectedRole = \App\Models\Role::find($validated['role_id']);
        $finalEmploymentTypeId = $validated['employment_type_id'];
        
        if ($selectedRole && ($selectedRole->name === 'hr' || $selectedRole->name === 'admin')) {
            // Force HR and Admin to be Plantilla
            $plantillaType = \App\Models\Employment::where('name', 'Plantilla')->first();
            if ($plantillaType) {
                $finalEmploymentTypeId = $plantillaType->id;
            }
        }

        // Generate employee_id: [employment_type_code][year][month][incremental]
        // Employment type code: 1 = Plantilla, 2 = JO
        $year = date('Y');
        $month = date('m');

        // Get the employment type to determine the code (use final employment type)
        $employmentType = \App\Models\Employment::find($finalEmploymentTypeId);
        $employmentTypeCode = '1'; // Default to Plantilla
        
        if ($employmentType) {
            // Use code based on employment type name: Plantilla = 1, JO = 2
            if (strtolower($employmentType->name) === 'jo' || $employmentType->name === 'JO') {
                $employmentTypeCode = '2';
            } else {
                $employmentTypeCode = '1'; // Plantilla
            }
        }

        // Get last user's ID to increment
        $lastId = User::max('id') ?? 0;
        $increment = str_pad($lastId + 1, 4, '0', STR_PAD_LEFT); // zero-padded to 4 digits

        $employeeId = $employmentTypeCode . $year . $month . $increment;

        // Build full name from parts
        $fullName = trim($validated['first_name'] . ' ' . 
            ($validated['middle_initial'] ?? '') . ' ' . 
            $validated['last_name']);

        // Create the user with new foreign keys
        // Set must_change_password to true for newly created accounts (HR sets initial password)
        $user = User::create([
            'employee_id' => $employeeId,
            'first_name' => $validated['first_name'],
            'middle_initial' => $validated['middle_initial'] ?? null,
            'last_name' => $validated['last_name'],
            'sex' => $validated['sex'],
            'name' => $validated['name'] ?? $fullName, // Use provided name or build from parts
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'position_id' => $validated['position_id'],
            'role_id' => $validated['role_id'],
            'project_id' => $validated['project_id'],
            'office_id' => $validated['office_id'] ?? null,
            'must_change_password' => true, // Force password change on first login
        ]);

        // Attach role (maintain backward compatibility with many-to-many)
        $user->roles()->attach((int) $validated['role_id']);

        // Attach employment type via pivot table (use final employment type determined above)
        $user->employmentTypes()->attach((int) $finalEmploymentTypeId);

        // Attach special capabilities if provided (for JO employees)
        if (isset($validated['special_capability_ids']) && !empty($validated['special_capability_ids'])) {
            $user->specialCapabilities()->attach($validated['special_capability_ids']);
        }

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user->load([
                'role:id,name',
                'position:id,title',
                'project:id,name,project_code,status',
                'office:id,name',
                'roles:id,name',
                'employmentTypes:id,name',
                'specialCapabilities:id,name'
            ])
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
        
        // Check if account is locked
        if ($user->is_locked) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return response()->json(['message' => 'Your account has been locked out! - HR'], 403);
        }
        
        // Log login activity
        LoginActivity::create([
            'user_id' => $user->id,
            'login_date' => now()->toDateString(),
            'login_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        // Only load necessary relationships with selected fields
        try {
            $user->load([
                'role:id,name',
                'position:id,title',
                'project:id,name,project_code,status',
                'office:id,name',
                'roles:id,name',
                'employmentTypes:id,name',
                'specialCapabilities:id,name'
            ]);
        } catch (\Exception $e) {
            // If relationships fail to load, just load the basic ones
            $user->load(['roles:id,name', 'employmentTypes:id,name']);
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
        
        // Only load necessary relationships with selected fields
        try {
            $user->load([
                'role:id,name',
                'position:id,title',
                'project:id,name,project_code,status',
                'office:id,name',
                'roles:id,name',
                'employmentTypes:id,name',
                'specialCapabilities:id,name'
            ]);
        } catch (\Exception $e) {
            $user->load(['roles:id,name', 'employmentTypes:id,name']);
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
        
        // Only load necessary relationships with selected fields
        try {
            $user->load([
                'role:id,name',
                'position:id,title',
                'project:id,name,project_code,status',
                'office:id,name',
                'roles:id,name',
                'employmentTypes:id,name',
                'specialCapabilities:id,name'
            ]);
        } catch (\Exception $e) {
            $user->load(['roles:id,name', 'employmentTypes:id,name']);
        }
        
        return response()->json([
            'user' => $user
        ], 200);
    }

    // UPDATE PROFILE (for current user)
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        // Eager load roles to avoid N+1 query
        $user->load('roles');
        $currentUserRole = $user->roles->first()?->name ?? $user->role?->name;

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'middle_initial' => 'nullable|string|max:10',
            'last_name' => 'sometimes|required|string|max:255',
            'name' => 'nullable|string|max:255', // Keep for backward compatibility
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|nullable|string|min:6',
            'current_password' => 'required_with:password|string',
            'profile_image' => 'sometimes|nullable|string', // Base64 encoded image
            'signature' => 'sometimes|nullable|string', // Base64 encoded signature
        ]);

        // Allow HR and Admin users to edit first_name and last_name
        if ($currentUserRole === 'hr' || $currentUserRole === 'admin') {
            // HR and Admin can edit their own first_name and last_name
        if (isset($validated['first_name'])) {
            $user->first_name = $validated['first_name'];
        }
            if (isset($validated['last_name'])) {
                $user->last_name = $validated['last_name'];
            }
        if (isset($validated['middle_initial'])) {
            $user->middle_initial = $validated['middle_initial'];
        }
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

        // Update signature if provided - encrypt it for security
        if (isset($validated['signature'])) {
            if (!empty($validated['signature'])) {
                // Encrypt the signature using Laravel's encryption
                $user->signature = Crypt::encryptString($validated['signature']);
            } else {
                // If empty string, remove signature
                $user->signature = null;
            }
        }

        $user->save();

        // Only load necessary relationships with selected fields
        try {
            $user->load([
                'role:id,name',
                'position:id,title',
                'project:id,name,project_code,status',
                'office:id,name',
                'roles:id,name',
                'employmentTypes:id,name',
                'specialCapabilities:id,name'
            ]);
        } catch (\Exception $e) {
            $user->load(['roles:id,name', 'employmentTypes:id,name']);
        }
        
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    public function getEmployees()
    {
        $employeeCount = User::count();
        
        // Count users with Plantilla employment type
        $plantillaCount = User::whereHas('employmentTypes', function($query) {
            $query->where('name', 'Plantilla');
        })->count();
        
        // Count users with JO (Job Order) employment type
        $joCount = User::whereHas('employmentTypes', function($query) {
            $query->where('name', 'JO');
        })->count();

        return response()->json([
            'total_employees' => $employeeCount,
            'total_plantilla' => $plantillaCount,
            'total_jo' => $joCount
        ]);
    }

    /**
     * Get position and employment distribution by office
     * Returns employee counts grouped by office and employment type
     */
    public function getPositionsByOffice()
    {
        $offices = Office::where('status', 'active')
            ->orderBy('name')
            ->get();

        $result = [];

        foreach ($offices as $office) {
            // Count Plantilla employees in this office
            $plantillaCount = User::where('office_id', $office->id)
                ->whereHas('employmentTypes', function($query) {
                    $query->where('name', 'Plantilla');
                })
                ->count();

            // Count JO employees in this office
            $joCount = User::where('office_id', $office->id)
                ->whereHas('employmentTypes', function($query) {
                    $query->where('name', 'JO');
                })
                ->count();

            // Include ALL offices, even if they have no employees
            $result[] = [
                'office' => $office->name,
                'office_code' => $office->code,
                'plantilla' => $plantillaCount,
                'job_order' => $joCount,
                'total' => $plantillaCount + $joCount,
            ];
        }

        // Count employees without office assignment (office_id is null)
        $unassignedPlantilla = User::whereNull('office_id')
            ->whereHas('employmentTypes', function($query) {
                $query->where('name', 'Plantilla');
            })
            ->count();

        $unassignedJO = User::whereNull('office_id')
            ->whereHas('employmentTypes', function($query) {
                $query->where('name', 'JO');
            })
            ->count();

        // Add unassigned employees entry if there are any
        if ($unassignedPlantilla > 0 || $unassignedJO > 0) {
            $result[] = [
                'office' => 'Unassigned / No Office',
                'office_code' => null,
                'plantilla' => $unassignedPlantilla,
                'job_order' => $unassignedJO,
                'total' => $unassignedPlantilla + $unassignedJO,
            ];
        }

        // Sort by total employees (descending), then by office name (ascending) for ties
        usort($result, function($a, $b) {
            if ($b['total'] === $a['total']) {
                return strcmp($a['office'], $b['office']);
            }
            return $b['total'] - $a['total'];
        });

        return response()->json([
            'offices' => $result
        ]);
    }

    /**
     * Get daily login activity for the current month
     * Returns count of unique logins per day
     */
    public function getDailyLoginActivity(Request $request)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);
        
        // Get the number of days in the requested month
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        
        // Get daily login counts (unique users per day)
        $dailyLogins = LoginActivity::select(
            DB::raw('DAY(login_date) as day'),
            DB::raw('COUNT(DISTINCT user_id) as login_count')
        )
        ->whereYear('login_date', $year)
        ->whereMonth('login_date', $month)
        ->groupBy(DB::raw('DAY(login_date)'))
        ->orderBy('day')
        ->pluck('login_count', 'day')
        ->toArray();
        
        // Build array for all days in the month, filling in 0 for days with no logins
        $result = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $result[] = [
                'day' => $day,
                'Daily Logins' => isset($dailyLogins[$day]) ? (int)$dailyLogins[$day] : 0
            ];
        }
        
        return response()->json([
            'year' => $year,
            'month' => $month,
            'daily_logins' => $result
        ]);
    }

    /**
     * Force password change for newly created accounts
     * This endpoint is accessible even when must_change_password is true
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }

        // Check if new password is different from current password
        if (Hash::check($validated['new_password'], $user->password)) {
            return response()->json([
                'message' => 'New password must be different from current password'
            ], 422);
        }

        // Update password and clear must_change_password flag
        $user->password = Hash::make($validated['new_password']);
        $user->must_change_password = false;
        $user->save();

        // Only load necessary relationships with selected fields
        try {
            $user->load([
                'role:id,name',
                'position:id,title',
                'project:id,name,project_code,status',
                'office:id,name',
                'roles:id,name',
                'employmentTypes:id,name',
                'specialCapabilities:id,name'
            ]);
        } catch (\Exception $e) {
            $user->load(['roles:id,name', 'employmentTypes:id,name']);
        }

        return response()->json([
            'message' => 'Password changed successfully',
            'user' => $user
        ]);
    }
}
    