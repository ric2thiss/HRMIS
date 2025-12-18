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
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('image')->nullable(); // Path to image file
            $table->foreignId('posted_by')->constrained('users')->onDelete('cascade'); // HR who posted it
            $table->timestamp('scheduled_at'); // When to start showing the announcement
            $table->integer('duration_days'); // Duration in days
            $table->timestamp('expires_at')->nullable(); // Calculated: scheduled_at + duration_days
            $table->enum('status', ['draft', 'active', 'expired'])->default('draft');
            $table->timestamps();
            
            // Indexes
            $table->index('posted_by');
            $table->index('status');
            $table->index('scheduled_at');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
