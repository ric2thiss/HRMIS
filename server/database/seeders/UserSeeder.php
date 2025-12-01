<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;
use App\Models\Position;
use App\Models\Project;
use App\Models\Employment;
use App\Models\Office;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete all existing users (use delete() instead of truncate() to respect foreign keys)
        User::query()->delete();
        
        // Get or create required master data
        $adminRole = Role::firstOrCreate(['name' => 'admin'], [
            'access_permissions_scope' => 'Full system access with all administrative privileges'
        ]);
        
        $hrRole = Role::firstOrCreate(['name' => 'hr'], [
            'access_permissions_scope' => 'Human Resources management access including employee management, approvals, and system settings'
        ]);
        
        // Create default position if it doesn't exist
        $adminPosition = Position::firstOrCreate(
            ['title' => 'Administrator'],
            [
                'description' => 'System Administrator position'
            ]
        );
        
        $hrPosition = Position::firstOrCreate(
            ['title' => 'HR Officer'],
            [
                'description' => 'Human Resources Officer position'
            ]
        );
        
        // Create default project if it doesn't exist
        $defaultProject = Project::firstOrCreate(
            ['name' => 'DICT Region 13 - Main Project'],
            [
                'status' => 'active',
                'project_manager' => 'Regional Director'
            ]
        );
        
        // Create Regional Office
        $regionalOffice = Office::firstOrCreate(
            ['name' => 'Regional Office'],
            [
                'code' => 'RO-13',
                'description' => 'DICT Region 13 Regional Office',
                'status' => 'active',
                'address' => 'DICT Region 13 Office',
                'contact_person' => 'Regional Director',
                'contact_email' => 'ro13@dict.gov.ph',
                'contact_phone' => null
            ]
        );
        
        // Get or create employment type (Plantilla for admin and hr)
        $plantillaEmployment = Employment::firstOrCreate(['name' => 'Plantilla']);
        
        // Create Administrator user
        $admin = User::create([
            'employee_id' => '1202512001',
            'first_name' => 'System',
            'middle_initial' => null,
            'last_name' => 'Administrator',
            'name' => 'System Administrator',
            'email' => 'admin@dict.gov.ph',
            'password' => Hash::make('admin123'),
            'position_id' => $adminPosition->id,
            'role_id' => $adminRole->id,
            'project_id' => $defaultProject->id,
            'office_id' => $regionalOffice->id,
        ]);
        
        // Attach role via many-to-many (backward compatibility)
        $admin->roles()->attach($adminRole->id);
        
        // Attach employment type
        $admin->employmentTypes()->attach($plantillaEmployment->id);
        
        // Create HR user
        $hr = User::create([
            'employee_id' => '1202512002',
            'first_name' => 'HR',
            'middle_initial' => null,
            'last_name' => 'Manager',
            'name' => 'HR Manager',
            'email' => 'hr@dict.gov.ph',
            'password' => Hash::make('hr123'),
            'position_id' => $hrPosition->id,
            'role_id' => $hrRole->id,
            'project_id' => $defaultProject->id,
            'office_id' => $regionalOffice->id,
        ]);
        
        // Attach role via many-to-many (backward compatibility)
        $hr->roles()->attach($hrRole->id);
        
        // Attach employment type
        $hr->employmentTypes()->attach($plantillaEmployment->id);
        
        $this->command->info('Users seeded successfully!');
        $this->command->info('Admin: admin@dict.gov.ph / admin123');
        $this->command->info('HR: hr@dict.gov.ph / hr123');
    }
}

