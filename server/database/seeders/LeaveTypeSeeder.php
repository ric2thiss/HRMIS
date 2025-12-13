<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LeaveType;

class LeaveTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $leaveTypes = [
            [
                'code' => 'VL',
                'name' => 'Vacation Leave',
                'max_days' => 15,
                'description' => 'Annual vacation leave credits',
                'requires_document' => false,
                'requires_approval' => true,
                'is_active' => true,
            ],
            [
                'code' => 'SL',
                'name' => 'Sick Leave',
                'max_days' => 15,
                'description' => 'For illness or medical appointments',
                'requires_document' => true,
                'requires_approval' => true,
                'is_active' => true,
            ],
            [
                'code' => 'SPL',
                'name' => 'Special Privilege Leave',
                'max_days' => 3,
                'description' => 'For personal matters, birthdays, or special occasions',
                'requires_document' => false,
                'requires_approval' => true,
                'is_active' => true,
            ],
            [
                'code' => 'ML',
                'name' => 'Maternity Leave',
                'max_days' => 105,
                'description' => 'For female employees who gave birth',
                'requires_document' => true,
                'requires_approval' => true,
                'is_active' => true,
            ],
            [
                'code' => 'PL',
                'name' => 'Paternity Leave',
                'max_days' => 7,
                'description' => 'For male employees whose spouse gave birth',
                'requires_document' => true,
                'requires_approval' => true,
                'is_active' => true,
            ],
            [
                'code' => 'SLB',
                'name' => 'Solo Parent Leave',
                'max_days' => 7,
                'description' => 'For solo parents',
                'requires_document' => true,
                'requires_approval' => true,
                'is_active' => true,
            ],
            [
                'code' => 'EL',
                'name' => 'Emergency Leave',
                'max_days' => 5,
                'description' => 'For emergencies and calamities',
                'requires_document' => true,
                'requires_approval' => true,
                'is_active' => true,
            ],
            [
                'code' => 'RL',
                'name' => 'Rehabilitation Leave',
                'max_days' => 6,
                'description' => 'For work-related injuries',
                'requires_document' => true,
                'requires_approval' => true,
                'is_active' => true,
            ],
            [
                'code' => 'SLW',
                'name' => 'Study Leave',
                'max_days' => 6,
                'description' => 'For educational purposes',
                'requires_document' => true,
                'requires_approval' => true,
                'is_active' => true,
            ],
            [
                'code' => 'SIL',
                'name' => 'Service Incentive Leave',
                'max_days' => 5,
                'description' => 'For employees with at least 1 year of service',
                'requires_document' => false,
                'requires_approval' => true,
                'is_active' => true,
            ],
        ];

        foreach ($leaveTypes as $leaveType) {
            LeaveType::updateOrCreate(
                ['code' => $leaveType['code']],
                $leaveType
            );
        }
    }
}

