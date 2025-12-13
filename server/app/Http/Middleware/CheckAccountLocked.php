<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountLocked
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->is_locked) {
            // Invalidate Sanctum tokens (if any) to force logout on API side
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }

            // Log out web guard if used
            try {
                Auth::guard('web')->logout();
            } catch (\Throwable $e) {
                // Ignore if guard not available
            }

            // Return standardized locked account response
            return response()->json([
                'message' => 'Your account has been locked out! - HR',
            ], 403);
        }

        return $next($request);
    }
}


