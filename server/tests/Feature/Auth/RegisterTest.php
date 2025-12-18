<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RegisterTest extends TestCase
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

    public function test_user_can_register_with_valid_data(): void
    {
        $role = Role::where('name', 'employee')->first();

        $userData = [
            'employee_id' => 'EMP001',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => $role->id,
        ];

        $response = $this->postJson('/api/register', $userData);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'user',
                         'token',
                     ],
                 ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john.doe@example.com',
            'employee_id' => 'EMP001',
        ]);
    }

    public function test_registration_requires_all_fields(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_registration_requires_unique_email(): void
    {
        $role = Role::where('name', 'employee')->first();
        
        User::factory()->create([
            'email' => 'existing@example.com',
            'role_id' => $role->id,
        ]);

        $response = $this->postJson('/api/register', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'existing@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => $role->id,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_validates_email_format(): void
    {
        $response = $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'invalid-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_requires_password_confirmation(): void
    {
        $role = Role::where('name', 'employee')->first();

        $response = $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword123!',
            'role_id' => $role->id,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }
}

