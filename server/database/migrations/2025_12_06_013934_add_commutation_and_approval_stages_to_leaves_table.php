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
        Schema::table('leaves', function (Blueprint $table) {
            // Add commutation field
            $table->enum('commutation', ['Requested', 'Not Requested'])->nullable()->after('remarks');
            
            // Add approval stage tracking fields for multi-stage approval workflow
            // For travel leave: Leave Credit Officer -> Recommendation Approver -> Leave Approver
            $table->boolean('leave_credit_officer_approved')->default(false)->after('leave_approver_id');
            $table->foreignId('leave_credit_officer_approved_by')->nullable()->constrained('users')->onDelete('set null')->after('leave_credit_officer_approved');
            $table->timestamp('leave_credit_officer_approved_at')->nullable()->after('leave_credit_officer_approved_by');
            $table->text('leave_credit_officer_remarks')->nullable()->after('leave_credit_officer_approved_at');
            
            $table->boolean('recommendation_approver_approved')->default(false)->after('leave_credit_officer_remarks');
            $table->foreignId('recommendation_approver_approved_by')->nullable()->constrained('users')->onDelete('set null')->after('recommendation_approver_approved');
            $table->timestamp('recommendation_approver_approved_at')->nullable()->after('recommendation_approver_approved_by');
            $table->text('recommendation_approver_remarks')->nullable()->after('recommendation_approver_approved_at');
            
            $table->boolean('leave_approver_approved')->default(false)->after('recommendation_approver_remarks');
            $table->foreignId('leave_approver_approved_by')->nullable()->constrained('users')->onDelete('set null')->after('leave_approver_approved');
            $table->timestamp('leave_approver_approved_at')->nullable()->after('leave_approver_approved_by');
            $table->text('leave_approver_remarks')->nullable()->after('leave_approver_approved_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropColumn([
                'commutation',
                'leave_credit_officer_approved',
                'leave_credit_officer_approved_by',
                'leave_credit_officer_approved_at',
                'leave_credit_officer_remarks',
                'recommendation_approver_approved',
                'recommendation_approver_approved_by',
                'recommendation_approver_approved_at',
                'recommendation_approver_remarks',
                'leave_approver_approved',
                'leave_approver_approved_by',
                'leave_approver_approved_at',
                'leave_approver_remarks',
            ]);
        });
    }
};
