<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleAccessLog extends Model
{
    protected $fillable = [
        'user_id',
        'module_name',
        'module_path',
        'access_date',
        'accessed_at',
        'ip_address',
    ];

    protected $casts = [
        'access_date' => 'date',
        'accessed_at' => 'datetime',
    ];

    /**
     * Get the user that accessed this module
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
