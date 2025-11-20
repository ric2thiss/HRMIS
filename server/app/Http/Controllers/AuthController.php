<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    // REGISTER
    // public function register(Request $request)
    // {
    //     $validated = $request->validate([
    //         'name' => 'required|string|max:255',
    //         'email' => 'required|string|email|unique:users',
    //         'password' => 'required|string|min:6|confirmed',
    //         'role' => 'required'
    //     ]);

    //     $user = User::create([
    //         'name' => $validated['name'],
    //         'email' => $validated['email'],
    //         'password' => Hash::make($validated['password']),
    //     ]);

    //     $user->roles()->attach($validated['role']);

    //     // $token = $user->createToken('api-token')->plainTextToken;

    //     return response()->json([
    //         'message' => "Successfully created!",
    //         'user' => $user,
    //     ], 201);
    // }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->roles()->attach((int) $validated['role_id']);

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user->load('roles')
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
            'user' => auth()->user()->load('roles')
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
        return response()->json($request->user());
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
            'user' => $request->user()
        ], 200);
    }
}
    