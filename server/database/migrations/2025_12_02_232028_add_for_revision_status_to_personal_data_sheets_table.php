<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if using SQLite (for testing) or MySQL (for production)
        $driver = DB::getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite doesn't support ALTER COLUMN, so we'll skip for tests
            // In production with MySQL, this will modify the enum
            return;
        }
        
        // For MySQL, modify the enum column
        DB::statement("ALTER TABLE personal_data_sheets MODIFY COLUMN status ENUM('draft', 'pending', 'approved', 'declined', 'for-revision') DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        
        if ($driver === 'sqlite') {
            return;
        }
        
        // Revert back to original enum values for MySQL
        DB::statement("ALTER TABLE personal_data_sheets MODIFY COLUMN status ENUM('draft', 'pending', 'approved', 'declined') DEFAULT 'draft'");
    }
};
