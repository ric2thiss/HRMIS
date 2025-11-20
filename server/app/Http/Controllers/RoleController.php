<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;

class RoleController extends Controller
{
    /**
     * Return all roles
     */
    public function index()
    {
        $roles = Role::select('id', 'name')->get();

        return response()->json([
            'roles' => $roles
        ]);
    }
}
