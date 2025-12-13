<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckPasswordChangeRequired
{
    /**
     * Handle an incoming request.
     * Blocks access to protected routes if user must change password
     * Allows access to password change endpoint
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If user is authenticated and must change password
        if ($user && $user->must_change_password) {
            // Allow access to these endpoints even when password change is required:
            // 1. Password change endpoint (to actually change the password)
            // 2. User endpoint (so frontend can check auth status and must_change_password flag)
            // 3. Logout endpoint (so user can logout if needed)
            if ($request->is('api/change-password') || 
                $request->is('api/change-password/*') ||
                $request->is('api/user') ||
                $request->is('api/logout')) {
                return $next($request);
            }

            // Block access to all other protected routes
            return response()->json([
                'message' => 'You must change your password before accessing this resource.',
                'must_change_password' => true
            ], 403);
        }

        return $next($request);
    }
}
