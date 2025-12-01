<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmploymentController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SystemController;
use App\Http\Controllers\PersonalDataSheetController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SpecialCapabilityController;
use App\Http\Controllers\OfficeController;

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
        Route::put('/profile', [AuthController::class, 'updateProfile']); // Update own profile
        Route::get('/user', [AuthController::class, 'user']);

        // User routes (HR and Admin only)
        Route::middleware('role:hr,admin')->group(function () {
        Route::get('/users', [UserController::class, 'getAllUsers']);
        Route::delete('/users/{id}', [UserController::class, 'delete']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        });
        
        // Admin only routes
        Route::middleware('role:admin')->group(function () {
            Route::put('/users/{id}/toggle-system-settings-access', [UserController::class, 'toggleSystemSettingsAccess']);
        });

        // Master List Routes (HR and Admin only)
        Route::middleware('role:hr,admin')->group(function () {
            // Roles CRUD
            Route::get('/roles', [RoleController::class, 'index']);
            Route::post('/roles', [RoleController::class, 'store']);
            Route::put('/roles/{id}', [RoleController::class, 'update']);
            Route::delete('/roles/{id}', [RoleController::class, 'destroy']);
            
            // Positions CRUD
            Route::get('/positions', [PositionController::class, 'index']);
            Route::post('/positions', [PositionController::class, 'store']);
            Route::put('/positions/{id}', [PositionController::class, 'update']);
            Route::delete('/positions/{id}', [PositionController::class, 'destroy']);
            
            // Projects CRUD
            Route::get('/projects', [ProjectController::class, 'index']);
            Route::post('/projects', [ProjectController::class, 'store']);
            Route::put('/projects/{id}', [ProjectController::class, 'update']);
            Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
            
            // Special Capabilities CRUD
            Route::get('/special-capabilities', [SpecialCapabilityController::class, 'index']);
            Route::post('/special-capabilities', [SpecialCapabilityController::class, 'store']);
            Route::put('/special-capabilities/{id}', [SpecialCapabilityController::class, 'update']);
            Route::delete('/special-capabilities/{id}', [SpecialCapabilityController::class, 'destroy']);
            
            // Offices CRUD
            Route::get('/offices', [OfficeController::class, 'index']);
            Route::post('/offices', [OfficeController::class, 'store']);
            Route::put('/offices/{id}', [OfficeController::class, 'update']);
            Route::delete('/offices/{id}', [OfficeController::class, 'destroy']);
        });

        // Employment Routes
        Route::get('/employment/types', [EmploymentController::class, "index"]);
        Route::middleware('role:hr,admin')->post('/employment/types', [EmploymentController::class, "store"]);
        
        // Public master list reads (for dropdowns in user forms)
        Route::get('/master-lists', function () {
            return response()->json([
                'positions' => \App\Models\Position::orderBy('title')->get(),
                'roles' => \App\Models\Role::orderBy('name')->get(),
                'projects' => \App\Models\Project::orderBy('name')->get(),
                'special_capabilities' => \App\Models\SpecialCapability::orderBy('name')->get(),
                'offices' => \App\Models\Office::orderBy('name')->get(),
            ]);
        });

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
            Route::post('/pds/{id}/return', [PersonalDataSheetController::class, 'returnToOwner']); // Return PDS to owner
            Route::get('/pds/employees/without-pds', [PersonalDataSheetController::class, 'employeesWithoutPds']); // Get employees without PDS
            Route::post('/pds/employees/{userId}/notify', [PersonalDataSheetController::class, 'notifyEmployee']); // Notify employee to fill PDS
        });
    });

    // Include GET maintenance-mode so frontend can fetch status (HR and Admin only)
    Route::middleware(['auth:sanctum', 'role:hr,admin'])->get('/maintenance-mode', [SystemController::class, 'getMaintenance']);
});

// Public maintenance status check (for frontend to check before login)
Route::get('/maintenance/status', [SystemController::class, 'getMaintenance']);

