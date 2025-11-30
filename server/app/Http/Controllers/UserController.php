<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function getAllUsers()
    {
        $currentUserId = auth()->id();

        $users = User::where('id', '!=', $currentUserId)
                    ->with(['roles', 'employmentTypes']) // plural if many-to-many
                    ->get();

        return response()->json([
            'users' => $users
        ]);
    }

    public function delete($id)
    {
        $user = User::find($id);

        if(!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully.'
        ],200);

    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if(!$user) return response()->json([
            "message" => "User not found."
        ], 404);

         $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role_id' => 'required|exists:roles,id'
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->roles()->sync([$validated['role_id']]); // update roles

        $user->save();

        return response()->json([
            "message" => "Updated Successfully",
            'user' => $user->load(['roles', 'employmentTypes'])
        ]);
    }

}
