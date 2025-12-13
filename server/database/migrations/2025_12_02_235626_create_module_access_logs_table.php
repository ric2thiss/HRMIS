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
        Schema::create('module_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('module_name', 100); // e.g., 'Leave', 'DTRAS', 'PDS'
            $table->string('module_path', 255)->nullable(); // Route path for reference
            $table->date('access_date')->index();
            $table->timestamp('accessed_at');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
            
            // Index for faster queries on module usage statistics
            $table->index(['module_name', 'access_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_access_logs');
    }
};
