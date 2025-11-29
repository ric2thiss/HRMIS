<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SystemController;



Route::get('/', function () {
    return view('welcome');
});

Route::middleware(['auth:sanctum', 'maintenance'])->group(function () {

    Route::get('/api/user', function (Request $request) {
        return response()->json([
            'user' => $request->user()->load('roles', 'employmentTypes')
        ]);
    });

    // Route::post('/api/logout', [AuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum'])->post('/api/logout', [AuthController::class, 'logout']);




