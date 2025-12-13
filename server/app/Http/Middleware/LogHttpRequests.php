<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\HttpRequestLog;
use Illuminate\Support\Facades\Auth;

class LogHttpRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        
        // Skip logging for certain routes (like health checks, static assets, etc.)
        $skipRoutes = ['/up', '/sanctum/csrf-cookie'];
        if (in_array($request->path(), $skipRoutes)) {
            return $next($request);
        }
        
        $response = $next($request);
        
        $endTime = microtime(true);
        $responseTime = round(($endTime - $startTime) * 1000); // Convert to milliseconds
        
        // Log the request asynchronously to avoid blocking
        try {
            HttpRequestLog::create([
                'user_id' => Auth::id(),
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status_code' => $response->getStatusCode(),
                'response_time' => $responseTime,
                'request_body' => $this->getRequestBody($request),
                'response_body' => null, // Don't log response body for performance
                'requested_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Silently fail - don't break the application if logging fails
            \Log::error('Failed to log HTTP request: ' . $e->getMessage());
        }
        
        return $response;
    }
    
    /**
     * Get request body (limited size for performance)
     */
    private function getRequestBody(Request $request): ?string
    {
        $body = $request->all();
        if (empty($body)) {
            return null;
        }
        
        $json = json_encode($body);
        // Limit to 1000 characters
        return mb_substr($json, 0, 1000);
    }
}
