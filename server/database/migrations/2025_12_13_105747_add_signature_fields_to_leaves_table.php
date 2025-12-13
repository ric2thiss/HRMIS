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
            $table->text('leave_credit_officer_signature')->nullable()->after('leave_credit_officer_remarks');
            $table->text('recommendation_approver_signature')->nullable()->after('recommendation_approver_remarks');
            $table->text('leave_approver_signature')->nullable()->after('leave_approver_remarks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropColumn([
                'leave_credit_officer_signature',
                'recommendation_approver_signature',
                'leave_approver_signature'
            ]);
        });
    }
};
