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
            $table->boolean('allow_logout_during_maintenance')->default(false)->after('is_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system_maintenance', function (Blueprint $table) {
            $table->dropColumn('allow_logout_during_maintenance');
        });
    }
};
