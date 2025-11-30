<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        // Validate input
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
            'employment_type_id' => 'required|exists:employment_type,id',
        ]);

        // Generate employee_id: [employment_type_id][year][month][incremental]
        $year = date('Y');
        $month = date('m');

        // Get last user's ID to increment
        $lastId = User::max('id') ?? 0;
        $increment = str_pad($lastId + 1, 4, '0', STR_PAD_LEFT); // zero-padded to 4 digits

        $employeeId = $validated['employment_type_id'] . $year . $month . $increment;

        // Create the user
        $user = User::create([
            'employee_id' => $employeeId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Attach role
        $user->roles()->attach((int) $validated['role_id']);

        // Attach employment type via pivot table
        $user->employmentTypes()->attach((int) $validated['employment_type_id']);

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user->load(['roles', 'employmentTypes']) // match method name exactly
        ], 201);
    }


    // LOGIN
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // $request->session()->regenerate();

        // $user = Auth::user()->load('roles'); // eager load roles

        return response()->json([
            'message' => "Successfully logged in!",
            'user' => auth()->user()->load(['roles', 'employmentTypes'])
        ]);
    }

    // LOGOUT
    public function logout(Request $request)
    {
       // Log out the user
        Auth::guard('web')->logout();

        // Invalidate the session
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Return response
       return response()->json(['message' => 'Logged out'], 200)
        ->withCookie(cookie()->forget('laravel_session'))
        ->withCookie(cookie()->forget('XSRF-TOKEN'));

    }

    // PROFILE (Protected)
    public function profile(Request $request)
    {
        return response()->json($request->user()->load(['roles', 'employmentTypes']));
    }

    // LOGOUT FROM ALL DEVICES
    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out from all devices'
        ], 200)->cookie(
            'token',
            '',
            -1,
            '/',
            null,
            false,
            true
        );
    }

    // RETURN AUTH USER
    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load(['roles', 'employmentTypes'])
        ], 200);
    }
}
    