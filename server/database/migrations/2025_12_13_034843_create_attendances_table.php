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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->string('ac_no')->nullable()->comment('Account Number from biometric device');
            $table->string('employee_id')->nullable()->comment('Employee ID (mapped from AC No.)');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('name')->nullable()->comment('Employee name from biometric device');
            $table->dateTime('date_time')->comment('Date and time from biometric device');
            $table->date('date')->comment('Extracted date for easier querying');
            $table->time('time')->comment('Extracted time for easier querying');
            $table->string('state')->nullable()->comment('State from biometric device (Check In/Check Out)');
            $table->string('import_filename')->nullable()->comment('Original filename of imported CSV');
            $table->foreignId('imported_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('imported_at')->nullable();
            $table->timestamps();

            // Indexes for better query performance
            $table->index('user_id');
            $table->index('date');
            $table->index('employee_id');
            $table->index(['user_id', 'date']);
            $table->index('date_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
