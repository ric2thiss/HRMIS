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
        Schema::create('announcement_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('announcements')->onDelete('cascade');
            $table->enum('recipient_type', ['user', 'office', 'position', 'all']); // Type of recipient
            $table->unsignedBigInteger('recipient_id')->nullable(); // ID of user, office, or position (null for 'all')
            
            $table->timestamps();
            
            // Indexes for performance (using shorter names for MySQL compatibility)
            $table->index(['announcement_id', 'recipient_type', 'recipient_id'], 'ann_rec_ann_id_type_id_idx');
            $table->index('recipient_type', 'ann_rec_type_idx');
            $table->index('recipient_id', 'ann_rec_id_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcement_recipients');
    }
};

