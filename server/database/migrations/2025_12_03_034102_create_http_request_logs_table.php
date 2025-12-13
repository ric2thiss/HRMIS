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
        Schema::create('http_request_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('method', 10); // GET, POST, PUT, DELETE, etc.
            $table->string('url', 500);
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->integer('status_code')->nullable();
            $table->integer('response_time')->nullable(); // in milliseconds
            $table->text('request_body')->nullable();
            $table->text('response_body')->nullable();
            $table->timestamp('requested_at');
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('method');
            $table->index('status_code');
            $table->index('requested_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('http_request_logs');
    }
};
