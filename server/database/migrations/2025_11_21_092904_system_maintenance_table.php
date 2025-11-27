<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('system_maintenance', function (Blueprint $table) {
            $table->id();

            // Is maintenance enabled?
            $table->boolean('is_enabled')->default(false);

            // Optional message shown to users
            $table->string('message')->nullable();

            // Who enabled it (admin ID)
            $table->unsignedBigInteger('enabled_by')->nullable();

            // When it started
            $table->timestamp('started_at')->nullable();

            // When it ended (or expected to end)
            $table->timestamp('ended_at')->nullable();

            $table->timestamps();

            // Add FK to users table
            $table->foreign('enabled_by')
                  ->references('id')
                  ->on('users')
                  ->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('system_maintenance');
    }
};
