<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/students', function() {
$students = [
            [
                "id" => 1,
                "first_name" => "Juan",
                "last_name" => "Dela Cruz",
                "age" => 20,
                "course" => "BSIT",
                "year_level" => 3,
                "email" => "juan.delacruz@example.com"
            ],
            [
                "id" => 2,
                "first_name" => "Maria",
                "last_name" => "Santos",
                "age" => 19,
                "course" => "BSCS",
                "year_level" => 2,
                "email" => "maria.santos@example.com"
            ],
            [
                "id" => 3,
                "first_name" => "Pedro",
                "last_name" => "Reyes",
                "age" => 21,
                "course" => "BSIT",
                "year_level" => 4,
                "email" => "pedro.reyes@example.com"
            ],
            [
                "id" => 4,
                "first_name" => "Ana",
                "last_name" => "Lopez",
                "age" => 18,
                "course" => "BSECE",
                "year_level" => 1,
                "email" => "ana.lopez@example.com"
            ],
            [
                "id" => 5,
                "first_name" => "Carlos",
                "last_name" => "Gonzales",
                "age" => 22,
                "course" => "BSIT",
                "year_level" => 4,
                "email" => "carlos.gonzales@example.com"
            ]
        ];

    return $students;
});
