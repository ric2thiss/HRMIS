<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\SanctumAuthController;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| Public Routes (Throttle Applied)
|--------------------------------------------------------------------------
*/
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/login', [SanctumAuthController::class, 'login']);
    Route::post('/register', [SanctumAuthController::class, 'register']);
});

/*
|--------------------------------------------------------------------------
| Protected Routes (Requires Token)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    // Auth actions
    Route::post('/logout', [SanctumAuthController::class, 'logout']);
    Route::post('/logout-all', [SanctumAuthController::class, 'logoutAll']);

    // Get authenticated user
    Route::get('/user', [SanctumAuthController::class, 'user']);


});

Route::get('/status', function () {
    return response()->json(['status' => 'API is running']);
});



