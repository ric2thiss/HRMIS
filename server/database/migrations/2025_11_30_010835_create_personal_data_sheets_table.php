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
        Schema::create('personal_data_sheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('form_data'); // Stores all PDS form data
            $table->enum('status', ['draft', 'pending', 'approved', 'declined'])->default('draft');
            $table->text('hr_comments')->nullable(); // Comments from HR when declined
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null'); // HR who reviewed
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            // Index for faster queries
            $table->index('user_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_data_sheets');
    }
};
