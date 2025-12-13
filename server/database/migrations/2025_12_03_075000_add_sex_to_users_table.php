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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('sex', ['Male', 'Female'])->nullable()->after('last_name');
        });

        // Set default values for existing accounts based on role
        DB::statement("
            UPDATE users 
            SET sex = CASE 
                WHEN EXISTS (
                    SELECT 1 FROM role_user 
                    WHERE role_user.user_id = users.id 
                    AND role_user.role_id IN (
                        SELECT id FROM roles WHERE name = 'hr'
                    )
                ) OR role_id IN (
                    SELECT id FROM roles WHERE name = 'hr'
                ) THEN 'Female'
                WHEN EXISTS (
                    SELECT 1 FROM role_user 
                    WHERE role_user.user_id = users.id 
                    AND role_user.role_id IN (
                        SELECT id FROM roles WHERE name = 'admin'
                    )
                ) OR role_id IN (
                    SELECT id FROM roles WHERE name = 'admin'
                ) THEN 'Male'
                ELSE 'Male'
            END
            WHERE sex IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('sex');
        });
    }
};
