<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function(){
    return view('login');
});

Route::get('/message', function () {
    return response()->json([
        'message' => 'Hello from Laravel backend 👋'
    ]);
});

