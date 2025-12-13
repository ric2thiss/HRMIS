<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'ac_no',
        'employee_id',
        'user_id',
        'name',
        'date_time',
        'date',
        'time',
        'state',
        'import_filename',
        'imported_by',
        'imported_at',
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'date' => 'date',
        'time' => 'string', // Store as string since it's a TIME column
        'imported_at' => 'datetime',
    ];

    /**
     * Get the user associated with this attendance record
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who imported this attendance record
     */
    public function importedBy()
    {
        return $this->belongsTo(User::class, 'imported_by');
    }
}
