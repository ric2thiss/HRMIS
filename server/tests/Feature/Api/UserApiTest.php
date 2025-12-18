<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserApiTest extends TestCase
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

    public function test_authenticated_user_can_view_their_profile(): void
    {
        $role = Role::where('name', 'employee')->first();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'is_locked' => false,
            'must_change_password' => false,
        ]);
        
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/user');

        $response->assertStatus(200)
                 ->assertJson([
                     'id' => $user->id,
                     'email' => $user->email,
                 ]);
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    public function test_hr_can_view_all_users(): void
    {
        $hrRole = Role::where('name', 'hr')->first();
        $empRole = Role::where('name', 'employee')->first();
        
        $hrUser = User::factory()->create([
            'role_id' => $hrRole->id,
            'is_locked' => false,
            'must_change_password' => false,
        ]);
        
        User::factory()->count(5)->create([
            'role_id' => $empRole->id,
        ]);

        Sanctum::actingAs($hrUser);

        $response = $this->getJson('/api/users');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         '*' => ['id', 'email'],
                     ],
                 ]);
    }

    public function test_employee_cannot_view_all_users(): void
    {
        $empRole = Role::where('name', 'employee')->first();
        $employee = User::factory()->create([
            'role_id' => $empRole->id,
            'is_locked' => false,
            'must_change_password' => false,
        ]);

        Sanctum::actingAs($employee);

        $response = $this->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_hr_can_update_user(): void
    {
        $hrRole = Role::where('name', 'hr')->first();
        $empRole = Role::where('name', 'employee')->first();
        
        $hrUser = User::factory()->create([
            'role_id' => $hrRole->id,
            'is_locked' => false,
            'must_change_password' => false,
        ]);
        
        $targetUser = User::factory()->create([
            'role_id' => $empRole->id,
            'first_name' => 'Old Name',
        ]);

        Sanctum::actingAs($hrUser);

        $response = $this->putJson("/api/users/{$targetUser->id}", [
            'first_name' => 'New Name',
            'last_name' => 'Updated',
            'email' => $targetUser->email,
        ]);

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('users', [
            'id' => $targetUser->id,
            'first_name' => 'New Name',
        ]);
    }

    public function test_hr_can_toggle_user_lock_status(): void
    {
        $hrRole = Role::where('name', 'hr')->first();
        $empRole = Role::where('name', 'employee')->first();
        
        $hrUser = User::factory()->create([
            'role_id' => $hrRole->id,
            'is_locked' => false,
            'must_change_password' => false,
        ]);
        
        $targetUser = User::factory()->create([
            'role_id' => $empRole->id,
            'is_locked' => false,
        ]);

        Sanctum::actingAs($hrUser);

        $response = $this->putJson("/api/users/{$targetUser->id}/toggle-lock");

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('users', [
            'id' => $targetUser->id,
            'is_locked' => true,
        ]);
    }

    public function test_admin_can_toggle_system_settings_access(): void
    {
        $adminRole = Role::where('name', 'admin')->first();
        $hrRole = Role::where('name', 'hr')->first();
        
        $admin = User::factory()->create([
            'role_id' => $adminRole->id,
            'is_locked' => false,
            'must_change_password' => false,
        ]);
        
        $hrUser = User::factory()->create([
            'role_id' => $hrRole->id,
            'has_system_settings_access' => false,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/users/{$hrUser->id}/toggle-system-settings-access");

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('users', [
            'id' => $hrUser->id,
            'has_system_settings_access' => true,
        ]);
    }
}

