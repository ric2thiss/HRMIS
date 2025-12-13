<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HttpRequestLog extends Model
{
    protected $fillable = [
        'user_id',
        'method',
        'url',
        'ip_address',
        'user_agent',
        'status_code',
        'response_time',
        'request_body',
        'response_body',
        'requested_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
    ];

    /**
     * Get the user that made this request
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
