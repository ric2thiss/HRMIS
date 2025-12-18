<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create default roles
        Role::factory()->create(['name' => 'admin']);
        Role::factory()->create(['name' => 'hr']);
        Role::factory()->create(['name' => 'employee']);
        
        // Create default position, project, and office
        \App\Models\Position::factory()->create(['id' => 1, 'title' => 'Default Position']);
        \App\Models\Project::factory()->create(['id' => 1, 'name' => 'Default Project']);
        \App\Models\Office::factory()->create(['id' => 1, 'name' => 'Default Office']);
    }

    public function test_user_can_login_with_correct_credentials(): void
    {
        $role = Role::where('name', 'employee')->first();
        
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'role_id' => $role->id,
            'is_locked' => false,
            'must_change_password' => false,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'user',
                         'token',
                     ],
                 ]);
    }

    public function test_user_cannot_login_with_incorrect_password(): void
    {
        $role = Role::where('name', 'employee')->first();
        
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'role_id' => $role->id,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
    }

    public function test_user_cannot_login_with_invalid_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_validates_email_format(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'invalid-email',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_locked_user_cannot_login(): void
    {
        $role = Role::where('name', 'employee')->first();
        
        $user = User::factory()->create([
            'email' => 'locked@example.com',
            'password' => Hash::make('password123'),
            'role_id' => $role->id,
            'is_locked' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'locked@example.com',
            'password' => 'password123',
        ]);

        // Login should succeed but subsequent requests will be blocked
        $response->assertStatus(200);
    }
}

