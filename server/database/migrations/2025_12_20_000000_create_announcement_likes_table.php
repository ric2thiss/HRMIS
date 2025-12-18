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
        Schema::create('announcement_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('announcements')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('reaction', ['like', 'dislike'])->default('like');
            $table->timestamps();
            
            // Ensure a user can only have one reaction per announcement
            $table->unique(['announcement_id', 'user_id']);
            
            // Indexes for faster queries
            $table->index('announcement_id');
            $table->index('user_id');
            $table->index('reaction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcement_likes');
    }
};

