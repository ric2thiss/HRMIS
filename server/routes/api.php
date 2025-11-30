<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmploymentController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SystemController;
use App\Http\Controllers\PersonalDataSheetController;

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
        Route::get('/user', [AuthController::class, 'user']);

        // User routes (HR and Admin only)
        Route::middleware('role:hr,admin')->group(function () {
        Route::get('/users', [UserController::class, 'getAllUsers']);
        Route::delete('/users/{id}', [UserController::class, 'delete']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        });

        // Role routes (HR and Admin only)
        Route::middleware('role:hr,admin')->get('/roles', [RoleController::class, 'index']);

        // Employment Routes
        Route::get('/employment/types', [EmploymentController::class, "index"]);
        Route::middleware('role:hr,admin')->post('/employment/types', [EmploymentController::class, "store"]);

        // System toggle (HR and Admin only)
        Route::middleware('role:hr,admin')->put('/maintenance-mode', [SystemController::class, 'toggleMaintenance']);

        // PDS Routes
        Route::get('/pds/my-pds', [PersonalDataSheetController::class, 'myPds']); // Check if user has PDS
        Route::get('/pds', [PersonalDataSheetController::class, 'index']); // Get all PDS (filtered by role)
        Route::post('/pds', [PersonalDataSheetController::class, 'store']); // Create new PDS
        Route::get('/pds/{id}', [PersonalDataSheetController::class, 'show']); // View specific PDS
        Route::put('/pds/{id}', [PersonalDataSheetController::class, 'update']); // Update PDS
        Route::post('/pds/{id}/submit', [PersonalDataSheetController::class, 'submit']); // Submit for approval
        Route::delete('/pds/{id}', [PersonalDataSheetController::class, 'destroy']); // Delete PDS (draft only)
        
        // HR/Admin only routes
        Route::middleware('role:hr,admin')->group(function () {
            Route::post('/pds/{id}/review', [PersonalDataSheetController::class, 'review']); // Approve/Decline PDS
            Route::get('/pds/employees/without-pds', [PersonalDataSheetController::class, 'employeesWithoutPds']); // Get employees without PDS
            Route::post('/pds/employees/{userId}/notify', [PersonalDataSheetController::class, 'notifyEmployee']); // Notify employee to fill PDS
        });
    });

    // Include GET maintenance-mode so frontend can fetch status (HR and Admin only)
    Route::middleware(['auth:sanctum', 'role:hr,admin'])->get('/maintenance-mode', [SystemController::class, 'getMaintenance']);
});

// Public maintenance status check (for frontend to check before login)
Route::get('/maintenance/status', [SystemController::class, 'getMaintenance']);

