<?php

use Illuminate\Support\Facades\Route;

// API Versioning - v1 routes
// Note: Laravel automatically prefixes API routes with 'api', so '/v1' becomes 'api/v1'
Route::prefix('v1')->group(function () {
    require __DIR__ . '/api/v1.php';
});

// Legacy routes (backward compatibility - maps to v1)
// This maintains backward compatibility for existing frontend code
// No prefix needed here since Laravel already adds 'api' prefix
Route::group([], function () {
    require __DIR__ . '/api/v1.php';
});

// Public maintenance status check (for frontend to check before login)
Route::get('/maintenance/status', [\App\Http\Controllers\SystemController::class, 'getMaintenance']);

// Public version endpoint (for dashboard display)
Route::get('/system-version', [\App\Http\Controllers\SystemController::class, 'getVersion']);
