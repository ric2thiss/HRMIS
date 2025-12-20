<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StandardTimeSetting extends Model
{
    protected $fillable = [
        'time_in',
        'time_out',
    ];

    protected $casts = [
        'time_in' => 'string',
        'time_out' => 'string',
    ];

    /**
     * Get the current standard time settings (singleton pattern)
     */
    public static function getSettings()
    {
        return static::firstOrCreate([], [
            'time_in' => '08:00:00',
            'time_out' => '17:00:00',
        ]);
    }
}
