<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnnouncementLike extends Model
{
    protected $fillable = [
        'announcement_id',
        'user_id',
        'reaction',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the announcement
     */
    public function announcement()
    {
        return $this->belongsTo(Announcement::class);
    }

    /**
     * Get the user who reacted
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

