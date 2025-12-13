<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  Roles allowed to access the route
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Check if user is authenticated
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            $user = auth()->user();
            
            // Ensure roles are loaded
            if (!$user->relationLoaded('roles')) {
                $user->load('roles');
            }
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }

            // Check if user has any of the required roles
            $hasRole = false;
            foreach ($roles as $role) {
                if ($user->hasRole($role)) {
                    $hasRole = true;
                    break;
                }
            }

            if (!$hasRole) {
                return response()->json([
                    'message' => 'Unauthorized. You do not have permission to access this resource.'
                ], 403);
            }

            return $next($request);
        } catch (\Exception $e) {
            \Log::error('CheckRole middleware error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Authorization check failed',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}

