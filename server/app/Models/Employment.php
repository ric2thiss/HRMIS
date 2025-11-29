<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employment extends Model
{
    protected $table = "employment_type";

    protected $fillable = [
        'name'
    ];

    public function users()
    {
        return $this->belongsToMany(
            User::class,
            'users_employment_types',
            'employment_type_id',
            'user_id'
        );
    }

}
