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
        Schema::create('standard_time_settings', function (Blueprint $table) {
            $table->id();
            $table->time('time_in')->default('08:00:00')->comment('Standard time in (e.g., 8:00 AM)');
            $table->time('time_out')->default('17:00:00')->comment('Standard time out (e.g., 5:00 PM)');
            $table->timestamps();
        });

        // Insert default values
        DB::table('standard_time_settings')->insert([
            'time_in' => '08:00:00',
            'time_out' => '17:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('standard_time_settings');
    }
};
