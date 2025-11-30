<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('system_maintenance', function (Blueprint $table) {
            // Remove allow_logout_during_maintenance column
            $table->dropColumn('allow_logout_during_maintenance');
            
            // Add allowed_login_roles as JSON field to store array of role names
            $table->json('allowed_login_roles')->nullable()->after('is_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system_maintenance', function (Blueprint $table) {
            $table->boolean('allow_logout_during_maintenance')->default(false)->after('is_enabled');
            $table->dropColumn('allowed_login_roles');
        });
    }
};
