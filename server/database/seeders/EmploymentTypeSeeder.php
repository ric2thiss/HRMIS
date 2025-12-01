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
        Employment::create(['name' => 'JO']);
        Employment::create(['name' => 'Plantilla']);
        
        $this->command->info('Employment types seeded: JO and Plantilla');
    }
}

