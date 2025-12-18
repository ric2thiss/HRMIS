<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Position;
use App\Models\Project;
use App\Models\Office;
use App\Models\Employment;
use App\Models\PersonalDataSheet;
use App\Models\LoginActivity;
use App\Models\ModuleAccessLog;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserTest extends TestCase
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
        Position::factory()->create(['id' => 1, 'title' => 'Default Position']);
        Project::factory()->create(['id' => 1, 'name' => 'Default Project']);
        Office::factory()->create(['id' => 1, 'name' => 'Default Office']);
    }

    public function test_user_has_role_relationship(): void
    {
        $role = Role::where('name', 'admin')->first();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertInstanceOf(Role::class, $user->role);
        $this->assertEquals('admin', $user->role->name);
    }

    public function test_user_has_roles_many_to_many_relationship(): void
    {
        $role = Role::where('name', 'employee')->first();
        $user = User::factory()->create(['role_id' => $role->id]);
        
        $hrRole = Role::where('name', 'hr')->first();
        $user->roles()->attach($hrRole->id);

        $this->assertTrue($user->roles->contains($hrRole));
    }

    public function test_user_has_role_method_checks_primary_role(): void
    {
        $role = Role::where('name', 'admin')->first();
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($user->hasRole('admin'));
        $this->assertFalse($user->hasRole('hr'));
    }

    public function test_user_has_role_method_checks_many_to_many_roles(): void
    {
        $empRole = Role::where('name', 'employee')->first();
        $user = User::factory()->create(['role_id' => $empRole->id]);
        
        $hrRole = Role::where('name', 'hr')->first();
        $user->roles()->attach($hrRole->id);

        $this->assertTrue($user->hasRole('hr'));
    }

    public function test_user_full_name_accessor_combines_name_parts(): void
    {
        $role = Role::where('name', 'employee')->first();
        
        $user = User::factory()->create([
            'first_name' => 'John',
            'middle_initial' => 'M',
            'last_name' => 'Doe',
            'role_id' => $role->id,
        ]);

        $this->assertEquals('John M Doe', $user->full_name);
    }

    public function test_user_full_name_accessor_falls_back_to_name_field(): void
    {
        $role = Role::where('name', 'employee')->first();
        
        $user = User::factory()->create([
            'name' => 'Jane Doe',
            'first_name' => null,
            'last_name' => null,
            'role_id' => $role->id,
        ]);

        $this->assertEquals('Jane Doe', $user->full_name);
    }

    public function test_user_full_name_handles_missing_middle_initial(): void
    {
        $role = Role::where('name', 'employee')->first();
        
        $user = User::factory()->create([
            'first_name' => 'John',
            'middle_initial' => null,
            'last_name' => 'Doe',
            'role_id' => $role->id,
        ]);

        $this->assertEquals('John Doe', $user->full_name);
    }

    public function test_user_password_is_hashed(): void
    {
        $role = Role::where('name', 'employee')->first();
        
        $user = User::factory()->create([
            'password' => 'plain-password',
            'role_id' => $role->id,
        ]);

        $this->assertNotEquals('plain-password', $user->password);
        $this->assertTrue(\Hash::check('plain-password', $user->password));
    }

    public function test_user_has_hidden_attributes(): void
    {
        $role = Role::where('name', 'employee')->first();
        
        $user = User::factory()->create(['role_id' => $role->id]);
        $array = $user->toArray();

        $this->assertArrayNotHasKey('password', $array);
        $this->assertArrayNotHasKey('remember_token', $array);
    }

    public function test_user_boolean_casts_work_correctly(): void
    {
        $role = Role::where('name', 'hr')->first();
        
        $user = User::factory()->create([
            'role_id' => $role->id,
            'has_system_settings_access' => 1,
            'is_locked' => 1,
            'must_change_password' => 0,
        ]);

        $this->assertIsBool($user->has_system_settings_access);
        $this->assertIsBool($user->is_locked);
        $this->assertIsBool($user->must_change_password);
        
        $this->assertTrue($user->has_system_settings_access);
        $this->assertTrue($user->is_locked);
        $this->assertFalse($user->must_change_password);
    }

    public function test_user_has_personal_data_sheet_relationship(): void
    {
        $role = Role::where('name', 'employee')->first();
        $user = User::factory()->create(['role_id' => $role->id]);
        
        $pds = PersonalDataSheet::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(PersonalDataSheet::class, $user->personalDataSheet);
        $this->assertEquals($pds->id, $user->personalDataSheet->id);
    }

    public function test_user_has_login_activities_relationship(): void
    {
        $role = Role::where('name', 'employee')->first();
        $user = User::factory()->create(['role_id' => $role->id]);
        
        $activity = LoginActivity::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->loginActivities->contains($activity));
    }

    public function test_user_has_module_access_logs_relationship(): void
    {
        $role = Role::where('name', 'employee')->first();
        $user = User::factory()->create(['role_id' => $role->id]);
        
        $log = ModuleAccessLog::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->moduleAccessLogs->contains($log));
    }

    public function test_user_set_name_attribute_parses_name_parts(): void
    {
        $role = Role::where('name', 'employee')->first();
        
        $user = new User([
            'role_id' => $role->id,
        ]);
        $user->name = 'John M Doe';
        $user->save();

        $this->assertEquals('John', $user->first_name);
        $this->assertEquals('M', $user->middle_initial);
        $this->assertEquals('Doe', $user->last_name);
    }
}

