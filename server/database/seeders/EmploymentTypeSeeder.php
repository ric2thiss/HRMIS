<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employment;

class EmploymentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete all existing employment types
        Employment::query()->delete();
        
        // Create only the two allowed employment types
        // IMPORTANT: Create Plantilla first so it gets ID 1 (for employee ID generation)
        // Employee ID format: 1 = Plantilla, 2 = JO
        Employment::create(['name' => 'Plantilla']);
        Employment::create(['name' => 'JO']);
        
        $this->command->info('Employment types seeded: Plantilla (ID 1) and JO (ID 2)');
    }
}

