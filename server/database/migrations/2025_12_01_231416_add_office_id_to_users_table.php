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
            // Add office_id foreign key - nullable (users can be assigned to offices later)
            $table->foreignId('office_id')->after('project_id')->nullable()->constrained('offices')->onDelete('set null');
            
            // Add index
            $table->index('office_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['office_id']);
            $table->dropIndex(['office_id']);
            $table->dropColumn('office_id');
        });
    }
};
