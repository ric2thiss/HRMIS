<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Announcement extends Model
{
    protected $fillable = [
        'title',
        'content',
        'image',
        'posted_by',
        'scheduled_at',
        'duration_days',
        'expires_at',
        'status',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who posted this announcement
     */
    public function postedBy()
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    /**
     * Get all likes/dislikes for this announcement
     */
    public function reactions()
    {
        return $this->hasMany(AnnouncementLike::class);
    }

    /**
     * Get all recipients for this announcement
     */
    public function recipients()
    {
        return $this->hasMany(AnnouncementRecipient::class);
    }

    /**
     * Scope to get active announcements (scheduled and not expired)
     * Includes both 'active' status and 'draft' status announcements that have passed their scheduled_at time
     */
    public function scopeActive($query)
    {
        $now = Carbon::now();
        return $query->where(function($q) use ($now) {
            $q->where('status', 'active')
              ->orWhere(function($subQ) use ($now) {
                  // Include draft announcements that have passed their scheduled time
                  $subQ->where('status', 'draft')
                       ->where('scheduled_at', '<=', $now);
              });
        })
        ->where('scheduled_at', '<=', $now)
        ->where('expires_at', '>', $now);
    }

    /**
     * Scope to get expired announcements
     */
    public function scopeExpired($query)
    {
        $now = Carbon::now();
        return $query->where(function($q) use ($now) {
            $q->where('status', 'expired')
              ->orWhere('expires_at', '<=', $now);
        });
    }

    /**
     * Scope to get draft announcements
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }
}
