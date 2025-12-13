<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Employment;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all users with their employment types
        $users = User::with('employmentTypes')->get();
        
        // Track used employee IDs to avoid conflicts
        $usedEmployeeIds = [];
        
        foreach ($users as $user) {
            // Get user's employment type
            $employmentType = $user->employmentTypes()->first();
            
            if (!$employmentType) {
                // Skip users without employment type
                continue;
            }
            
            // Determine correct employment type code
            $employmentTypeCode = '1'; // Default to Plantilla
            if (strtolower($employmentType->name) === 'jo' || $employmentType->name === 'JO') {
                $employmentTypeCode = '2';
            }
            
            $newEmployeeId = null;
            $currentEmployeeId = $user->employee_id;
            
            // If employee_id exists and is valid (11 digits), try to preserve year/month/increment
            if ($currentEmployeeId && strlen($currentEmployeeId) >= 11) {
                // Extract parts: first digit is old code, next 4 are year, next 2 are month, last 4 are increment
                $year = substr($currentEmployeeId, 1, 4);
                $month = substr($currentEmployeeId, 5, 2);
                $increment = substr($currentEmployeeId, 7, 4);
                
                // Validate extracted parts
                if (is_numeric($year) && is_numeric($month) && is_numeric($increment) 
                    && strlen($year) === 4 && strlen($month) === 2 && strlen($increment) === 4) {
                    // Generate new employee ID with correct employment type code
                    $newEmployeeId = $employmentTypeCode . $year . $month . $increment;
                }
            }
            
            // If we couldn't preserve the old ID or it doesn't exist, generate new one
            if (!$newEmployeeId) {
                // Use creation date or current date
                $createdAt = $user->created_at ?? now();
                $year = $createdAt->format('Y');
                $month = $createdAt->format('m');
                
                // Find the highest increment for this employment type + year + month combination
                $pattern = $employmentTypeCode . $year . $month . '%';
                $maxEmployeeId = User::where('employee_id', 'like', $pattern)
                    ->where('id', '!=', $user->id)
                    ->orderBy('employee_id', 'desc')
                    ->value('employee_id');
                
                if ($maxEmployeeId) {
                    // Extract increment from max ID and add 1
                    $maxIncrement = (int) substr($maxEmployeeId, 7, 4);
                    $increment = str_pad($maxIncrement + 1, 4, '0', STR_PAD_LEFT);
                } else {
                    // No existing IDs with this pattern, start from 0001
                    $increment = '0001';
                }
                
                $newEmployeeId = $employmentTypeCode . $year . $month . $increment;
            }
            
            // Check for conflicts and resolve if needed
            while (in_array($newEmployeeId, $usedEmployeeIds) || 
                   User::where('employee_id', $newEmployeeId)->where('id', '!=', $user->id)->exists()) {
                // Extract parts and increment
                $year = substr($newEmployeeId, 1, 4);
                $month = substr($newEmployeeId, 5, 2);
                $currentIncrement = (int) substr($newEmployeeId, 7, 4);
                $newIncrement = str_pad($currentIncrement + 1, 4, '0', STR_PAD_LEFT);
                $newEmployeeId = $employmentTypeCode . $year . $month . $newIncrement;
            }
            
            // Mark this ID as used
            $usedEmployeeIds[] = $newEmployeeId;
            
            // Update the user's employee_id
            DB::table('users')
                ->where('id', $user->id)
                ->update(['employee_id' => $newEmployeeId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration updates existing data, so we can't easily reverse it
        // The down method is intentionally left empty
    }
};
