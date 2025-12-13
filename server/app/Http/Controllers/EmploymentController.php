<?php

namespace App\Http\Controllers;

use App\Models\Employment;
use Illuminate\Http\Request;

class EmploymentController extends Controller
{
    public function index()
    {
        return Employment::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "name" => "required|string|max:50|unique:employment_type,name"
        ]);

        $employment = Employment::create($validated);

        return response()->json([
            "message" => "Employment type created successfully.",
            "data" => $employment
        ], 201);
    }

    
}
