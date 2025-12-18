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
use App\Http\Controllers\ModuleAccessController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\ApprovalNameController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\AttendanceController;

// Apply 'maintenance' and 'log-http' middleware to all API routes
Route::middleware(['maintenance', \App\Http\Middleware\LogHttpRequests::class])->group(function () {

    // -------------------
    // Public routes
    // -------------------
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // -------------------
    // Protected routes (authenticated + not locked + password change check)
    // -------------------
    Route::middleware([
        'auth:sanctum', 
        \App\Http\Middleware\CheckAccountLocked::class,
        \App\Http\Middleware\CheckPasswordChangeRequired::class
    ])->group(function () {

        // Password change route (must be accessible even when password change is required)
        // This is handled in the middleware to allow access
        Route::post('/change-password', [AuthController::class, 'changePassword']);

        // Auth routes
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::put('/profile', [AuthController::class, 'updateProfile']); // Update own profile
        Route::get('/user', [AuthController::class, 'user']);

        // User routes (HR only)
        Route::middleware('role:hr')->group(function () {
        Route::get('/users', [UserController::class, 'getAllUsers']);
        Route::delete('/users/{id}', [UserController::class, 'delete']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::put('/users/{id}/toggle-lock', [UserController::class, 'toggleLock']);
        });
        
        // Admin only routes
        Route::middleware('role:admin')->group(function () {
            Route::put('/users/{id}/toggle-system-settings-access', [UserController::class, 'toggleSystemSettingsAccess']);
            
            // Admin Dashboard routes
            Route::get('/admin/system-health', [AdminDashboardController::class, 'getSystemHealth']);
            Route::get('/admin/database-health', [AdminDashboardController::class, 'getDatabaseHealth']);
            Route::get('/admin/storage-health', [AdminDashboardController::class, 'getStorageHealth']);
            Route::get('/admin/memory-health', [AdminDashboardController::class, 'getMemoryHealth']);
            Route::get('/admin/activity-logs', [AdminDashboardController::class, 'getActivityLogs']);
            Route::get('/admin/login-logs', [AdminDashboardController::class, 'getLoginLogs']);
            Route::get('/admin/http-request-logs', [AdminDashboardController::class, 'getHttpRequestLogs']);
            Route::get('/admin/export-analytics', [AdminDashboardController::class, 'exportAnalytics']);
            
            // Cleanup routes (Admin only)
            Route::post('/admin/cleanup/activity-logs', [AdminDashboardController::class, 'cleanupActivityLogs']);
            Route::post('/admin/cleanup/login-logs', [AdminDashboardController::class, 'cleanupLoginLogs']);
            Route::post('/admin/cleanup/http-request-logs', [AdminDashboardController::class, 'cleanupHttpRequestLogs']);
            Route::post('/admin/cleanup/storage', [AdminDashboardController::class, 'cleanupStorage']);
            
            // Database backup route (Admin only)
            Route::get('/admin/backup-database', [AdminDashboardController::class, 'backupDatabase']);
            
            // Clear cache route (Admin only)
            Route::post('/admin/clear-cache', [AdminDashboardController::class, 'clearCache']);
        });

        // Master List Routes
        // Roles - Read access for Admin (for system settings), full CRUD for HR
        Route::get('/roles', [RoleController::class, 'index']); // Read access for authenticated users (HR and Admin)
        
        Route::middleware('role:hr')->group(function () {
            // Roles CRUD (Create, Update, Delete - HR only)
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
            
            // Approval Names CRUD
            Route::get('/approval-names', [ApprovalNameController::class, 'index']);
            Route::post('/approval-names', [ApprovalNameController::class, 'store']);
            Route::put('/approval-names/{id}', [ApprovalNameController::class, 'update']);
            Route::delete('/approval-names/{id}', [ApprovalNameController::class, 'destroy']);
            
            // Leave Types CRUD (Create, Update, Delete - HR only)
            Route::post('/leave-types', [LeaveTypeController::class, 'store']);
            Route::put('/leave-types/{id}', [LeaveTypeController::class, 'update']);
            Route::delete('/leave-types/{id}', [LeaveTypeController::class, 'destroy']);
            
            // Attendance Import (HR only)
            Route::post('/attendance/import', [AttendanceController::class, 'import']);
            Route::get('/attendance/import-history', [AttendanceController::class, 'importHistory']);
            Route::delete('/attendance/undo-import', [AttendanceController::class, 'undoImport']);
        });
        
        // Attendance routes - All authenticated users can view their own attendance
        // HR and Admin can view all attendance records
        Route::get('/attendance', [AttendanceController::class, 'index']);

        // Employment Routes
        Route::get('/employment/types', [EmploymentController::class, "index"]);
        Route::middleware('role:hr')->post('/employment/types', [EmploymentController::class, "store"]);
        
        // Public master list reads (for dropdowns in user forms)
        Route::get('/master-lists', function () {
            return response()->json([
                'positions' => \App\Models\Position::orderBy('title')->get(),
                'roles' => \App\Models\Role::orderBy('name')->get(),
                'projects' => \App\Models\Project::orderBy('name')->get(),
                'special_capabilities' => \App\Models\SpecialCapability::orderBy('name')->get(),
                'offices' => \App\Models\Office::orderBy('name')->get(),
                'approval_names' => \App\Models\ApprovalName::active()->ordered()->get(),
            ]);
        });

        // System toggle (Admin only)
        Route::middleware('role:admin')->put('/maintenance-mode', [SystemController::class, 'toggleMaintenance']);
        
        // System version management (Admin only)
        Route::middleware('role:admin')->put('/system-version', [SystemController::class, 'updateVersion']);

        // Module Access Tracking (all authenticated users)
        Route::post('/module-access/log', [ModuleAccessController::class, 'logAccess']);

        // PDS Routes
        Route::get('/pds/my-pds', [PersonalDataSheetController::class, 'myPds']); // Check if user has PDS
        Route::get('/pds', [PersonalDataSheetController::class, 'index']); // Get all PDS (filtered by role)
        Route::post('/pds', [PersonalDataSheetController::class, 'store']); // Create new PDS
        Route::get('/pds/{id}', [PersonalDataSheetController::class, 'show']); // View specific PDS
        Route::put('/pds/{id}', [PersonalDataSheetController::class, 'update']); // Update PDS
        Route::post('/pds/{id}/submit', [PersonalDataSheetController::class, 'submit']); // Submit for approval
        Route::delete('/pds/{id}', [PersonalDataSheetController::class, 'destroy']); // Delete PDS (draft only)
        
        // HR only routes
        Route::middleware('role:hr')->group(function () {
            Route::post('/pds/{id}/review', [PersonalDataSheetController::class, 'review']); // Approve/Decline PDS
            Route::post('/pds/{id}/return', [PersonalDataSheetController::class, 'returnToOwner']); // Return PDS to owner
            Route::get('/pds/employees/without-pds', [PersonalDataSheetController::class, 'employeesWithoutPds']); // Get employees without PDS
            Route::post('/pds/employees/{userId}/notify', [PersonalDataSheetController::class, 'notifyEmployee']); // Notify employee to fill PDS
        });

        // Leave Application Routes
        Route::get('/leave-types', [LeaveTypeController::class, 'index']); // Get all leave types (for dropdowns)
        Route::get('/leaves/my-leave-credits', [LeaveController::class, 'getMyLeaveCredits']); // Get current user's leave credits
        Route::get('/leaves/my-leaves', [LeaveController::class, 'myLeaves']); // Get current user's leaves
        Route::get('/leaves/my-pending-approvals', [LeaveController::class, 'myPendingApprovals']); // Get pending approvals for current approver
        Route::get('/leaves', [LeaveController::class, 'index']); // Get all leaves (filtered by role)
        Route::post('/leaves', [LeaveController::class, 'store']); // Create new leave application
        Route::get('/leaves/{id}', [LeaveController::class, 'show']); // View specific leave
        Route::put('/leaves/{id}', [LeaveController::class, 'update']); // Update leave (cancel only)
        Route::delete('/leaves/{id}', [LeaveController::class, 'destroy']); // Delete leave (pending only)
        
        // Leave approval route (HR/Admin or assigned approvers)
        Route::post('/leaves/{id}/approve', [LeaveController::class, 'approve']); // Approve/Reject leave
        
        // Check if user is an approver
        Route::get('/approval-names/check-approver', [ApprovalNameController::class, 'checkIfApprover']);
    });

    // Include GET maintenance-mode so frontend can fetch status (Admin only)
    Route::middleware(['auth:sanctum', 'role:admin'])->get('/maintenance-mode', [SystemController::class, 'getMaintenance']);

    // For HR use (HR Dashboard)
    Route::middleware(['auth:sanctum', 'role:hr'])->get('/employees', [AuthController::class, 'getEmployees']);
    Route::middleware(['auth:sanctum', 'role:hr'])->get('/daily-login-activity', [AuthController::class, 'getDailyLoginActivity']);
    Route::middleware(['auth:sanctum', 'role:hr'])->get('/positions-by-office', [AuthController::class, 'getPositionsByOffice']);
    Route::middleware(['auth:sanctum', 'role:hr'])->get('/module-usage', [ModuleAccessController::class, 'getModuleUsage']);
    // Route::middleware(['auth:sanctum', 'role:hr'])->get('/employments-types', [EmploymentController::class, 'getEmploymentTypes']);

});

// Public maintenance status check (for frontend to check before login)
Route::get('/maintenance/status', [SystemController::class, 'getMaintenance']);

// Public version endpoint (for dashboard display)
Route::get('/system-version', [SystemController::class, 'getVersion']);

