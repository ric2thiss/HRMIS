<?php 

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = [
        'name',
        'access_permissions_scope',
    ];

    /**
     * Users with this role as primary role (belongsTo)
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Legacy many-to-many relationship (for backward compatibility)
     */
    public function usersMany()
    {
        return $this->belongsToMany(User::class);
    }
}
