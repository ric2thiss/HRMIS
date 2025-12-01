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
        Schema::table('users', function (Blueprint $table) {
            // Add foreign key columns - NOT NULL (required)
            $table->foreignId('position_id')->after('profile_image')->constrained('positions')->onDelete('restrict');
            $table->foreignId('role_id')->after('position_id')->constrained('roles')->onDelete('restrict');
            $table->foreignId('project_id')->after('role_id')->constrained('projects')->onDelete('restrict');
            
            // Add indexes
            $table->index('position_id');
            $table->index('role_id');
            $table->index('project_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['position_id']);
            $table->dropForeign(['role_id']);
            $table->dropForeign(['project_id']);
            $table->dropIndex(['position_id']);
            $table->dropIndex(['role_id']);
            $table->dropIndex(['project_id']);
            $table->dropColumn(['position_id', 'role_id', 'project_id']);
        });
    }
};

