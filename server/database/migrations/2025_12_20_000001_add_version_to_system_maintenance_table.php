<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('system_maintenance', function (Blueprint $table) {
            $table->string('version')->default('1.0.0')->after('message');
        });
    }

    public function down()
    {
        Schema::table('system_maintenance', function (Blueprint $table) {
            $table->dropColumn('version');
        });
    }
};

