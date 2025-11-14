<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentController;


Route::get('/', function () {
    return view('home');
});

//This is benjie
Route::get('/students', [StudentController::class, 'index']);
