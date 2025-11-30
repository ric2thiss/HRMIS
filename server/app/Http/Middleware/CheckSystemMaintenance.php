<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\SystemMaintenance;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CheckSystemMaintenance
{
    public function handle(Request $request, Closure $next): Response
    {
        $maintenance = SystemMaintenance::first();

        // -----------------------------------------
        // If no maintenance record or disabled → allow
        // -----------------------------------------
        if (!$maintenance || !$maintenance->is_enabled) {
            Log::info('Maintenance: OFF → allow request');
            return $next($request);
        }

        // -----------------------------------------
        // Try to authenticate user FIRST (important)
        // React sends Sanctum cookies, so auth may work
        // -----------------------------------------
        if (Auth::check()) {
            $user = Auth::user();
            $userRoles = $user->roles->pluck('name')->toArray();
            $allowedRoles = $maintenance->allowed_login_roles ?? ['admin', 'hr'];

            // Check if user has any of the allowed roles
            $hasAllowedRole = false;
            foreach ($userRoles as $role) {
                if (in_array($role, $allowedRoles)) {
                    $hasAllowedRole = true;
                    break;
                }
            }

            if ($hasAllowedRole) {
                Log::info('Maintenance: User with allowed role bypass', [
                    'user_id' => Auth::id(), 
                    'user_roles' => $userRoles,
                    'allowed_roles' => $allowedRoles
                ]);
                return $next($request);
            }

            Log::info('Maintenance: User without allowed role blocked', [
                'user_id' => Auth::id(),
                'user_roles' => $userRoles,
                'allowed_roles' => $allowedRoles
            ]);

            // Return 503 → React interceptor handles force logout + redirect
            return response()->json([
                'message' => $maintenance->message ?? 'System is under maintenance.'
            ], 503);
        }

        // -----------------------------------------
        // User is NOT authenticated
        // Allow login page access:
        // Only allow login if user's role is in allowed_login_roles
        // -----------------------------------------
        if ($request->is('api/login')) {
            Log::info('Maintenance: login attempt received');

            // Try validating credentials
            $credentials = $request->only('email', 'password');

            if (Auth::attempt($credentials)) {
                $user = Auth::user();
                $userRoles = $user->roles->pluck('name')->toArray();
                $allowedRoles = $maintenance->allowed_login_roles ?? ['admin', 'hr'];
                
                // Check if user has any of the allowed roles
                $hasAllowedRole = false;
                foreach ($userRoles as $role) {
                    if (in_array($role, $allowedRoles)) {
                        $hasAllowedRole = true;
                        break;
                    }
                }
                
                if ($hasAllowedRole) {
                    Log::info('Maintenance: User with allowed role logged in', [
                        'user_id' => $user->id,
                        'user_roles' => $userRoles,
                        'allowed_roles' => $allowedRoles
                    ]);
                    return $next($request);
                }

                // User without allowed role attempting login → block
                Log::info('Maintenance: User without allowed role tried to login → blocked', [
                    'user_roles' => $userRoles,
                    'allowed_roles' => $allowedRoles
                ]);
                Auth::logout();

                return response()->json([
                    'message' => $maintenance->message ?? 'System is under maintenance.'
                ], 503);
            }

            // Incorrect credentials → normal behavior
            Log::info('Maintenance: invalid login credentials');
            return $next($request);
        }

        // Guest trying to access other API routes → block
        Log::info('Maintenance: guest request blocked');

        return response()->json([
            'message' => $maintenance->message ?? 'System is under maintenance.'
        ], 503);
    }
}
