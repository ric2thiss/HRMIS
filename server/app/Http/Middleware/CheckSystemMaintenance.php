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

            // Admin bypass
            if (Auth::user()->hasRole('admin')) {
                Log::info('Maintenance: admin bypass', ['user_id' => Auth::id()]);
                return $next($request);
            }

            Log::info('Maintenance: non-admin authenticated user blocked', [
                'user_id' => Auth::id()
            ]);

            // Return 503 → React interceptor handles force logout + redirect
            return response()->json([
                'message' => $maintenance->message ?? 'System is under maintenance.'
            ], 503);
        }

        // -----------------------------------------
        // User is NOT authenticated
        // Allow login page access:
        // Only block actual login POST if not admin
        // -----------------------------------------
        if ($request->is('api/login')) {
            Log::info('Maintenance: login attempt received');

            // Try validating credentials
            $credentials = $request->only('email', 'password');

            if (Auth::attempt($credentials)) {

                if (Auth::user()->hasRole('admin')) {
                    Log::info('Maintenance: admin logged in during maintenance');
                    return $next($request);
                }

                // Normal user attempting login → block
                Log::info('Maintenance: non-admin tried to login → blocked');
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
