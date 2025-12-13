<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemMaintenance extends Model
{
    protected $table = "system_maintenance";
    
    protected $fillable = [
        'is_enabled',
        'allowed_login_roles',
        'message',
        'version',
        'enabled_by',
        'started_at',
        'ended_at'
    ];

    protected $casts = [
        'allowed_login_roles' => 'array',
    ];

}
