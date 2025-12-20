<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnnouncementRecipient extends Model
{
    protected $fillable = [
        'announcement_id',
        'recipient_type',
        'recipient_id',
    ];

    /**
     * Get the announcement that owns this recipient
     */
    public function announcement()
    {
        return $this->belongsTo(Announcement::class);
    }
}

