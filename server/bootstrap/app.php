<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        
        // Ensure CORS middleware runs early for preflight requests
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        
        $middleware->alias([
            'maintenance' => \App\Http\Middleware\CheckSystemMaintenance::class,
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
        
        // Configure rate limiting - throttleApi() automatically applies throttle:api middleware
        // Rate limiter is configured in AppServiceProvider
        $middleware->throttleApi();
        
        // $middleware->prepend(\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class);
        // $middleware->append(\Illuminate\Routing\Middleware\SubstituteBindings::class);

    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
