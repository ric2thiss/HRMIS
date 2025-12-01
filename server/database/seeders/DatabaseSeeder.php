<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles first
        $this->call(RoleSeeder::class);
        
        // Seed employment types (JO and Plantilla only)
        $this->call(EmploymentTypeSeeder::class);
        
        // Seed users (will delete all existing and create admin + hr)
        $this->call(UserSeeder::class);
    }
}
