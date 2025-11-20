<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RoleController;


Route::get('/', function () {
    return view('welcome');
});

Route::middleware(['auth:sanctum'])->get('/api/user', function (Request $request) {
    return response()->json([
        // 'user' => $request->user(),
        'user' => $request->user()->load('roles')
    ]);
});

Route::middleware(['auth:sanctum'])->post('/api/logout', [AuthController::class, 'logout']);

