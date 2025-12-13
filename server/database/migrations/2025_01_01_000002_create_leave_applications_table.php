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
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('leave_type_id')->constrained()->onDelete('restrict');
            $table->date('start_date');
            $table->date('end_date');
            $table->json('exclusive_dates'); // Array of selected dates
            $table->integer('working_days');
            $table->text('remarks')->nullable();
            
            // Approval officers (references to approval_names table)
            $table->foreignId('leave_credit_authorized_officer_id')->nullable()->constrained('approval_names')->onDelete('set null');
            $table->foreignId('recommendation_approver_id')->nullable()->constrained('approval_names')->onDelete('set null');
            $table->foreignId('leave_approver_id')->nullable()->constrained('approval_names')->onDelete('set null');
            
            // Show remarks flags
            $table->boolean('show_remarks_to_leave_credit_officer')->default(false);
            $table->boolean('show_remarks_to_recommendation_approver')->default(false);
            $table->boolean('show_remarks_to_leave_approver')->default(false);
            
            // Status and approval
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_remarks')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('user_id');
            $table->index('status');
            $table->index('start_date');
            $table->index('end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaves');
    }
};

