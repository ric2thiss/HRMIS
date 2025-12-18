<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginActivity extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'login_date',
        'login_at',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'login_date' => 'date',
        'login_at' => 'datetime',
    ];

    /**
     * Get the user that performed this login
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
