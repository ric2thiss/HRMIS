<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ModuleAccessLog>
 */
class ModuleAccessLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'module_name' => fake()->randomElement(['attendance', 'leave', 'pds', 'dashboard']),
            'module_path' => '/test/path',
            'access_date' => fake()->date(),
            'accessed_at' => fake()->dateTime(),
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
        ];
    }
}

