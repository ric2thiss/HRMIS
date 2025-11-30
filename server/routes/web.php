<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SystemController;



Route::get('/', function () {
    return view('welcome');
});

// Removed duplicate /api/user route - it's defined in api.php

Route::middleware(['auth:sanctum'])->post('/api/logout', [AuthController::class, 'logout']);




