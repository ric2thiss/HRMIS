<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SystemController;

// Apply 'maintenance' middleware to all API routes
Route::middleware('maintenance')->group(function () {

    // -------------------
    // Public routes
    // -------------------
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // -------------------
    // Protected routes (authenticated)
    // -------------------
    Route::middleware('auth:sanctum')->group(function () {

        // Auth routes
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::get('/user', [AuthController::class, 'user']); // <--- add this

        // Role routes
        Route::get('/roles', [RoleController::class, 'index']);

        // User routes
        Route::get('/users', [UserController::class, 'getAllUsers']);
        Route::delete('/users/{id}', [UserController::class, 'delete']);
        Route::put('/users/{id}', [UserController::class, 'update']);

        // System toggle (admin only inside controller)
        Route::put('/maintenance-mode', [SystemController::class, 'toggleMaintenance']);
    });

    // Include GET maintenance-mode so frontend can fetch status
    Route::middleware('auth:sanctum')->get('/maintenance-mode', [SystemController::class, 'getMaintenance']);
});

Route::get('/maintenance/status', [SystemController::class, 'getMaintenance']);
