<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'name',
        'first_name',
        'middle_initial',
        'last_name',
        'sex',
        'email',
        'password',
        'profile_image',
        'signature',
        'position_id',
        'role_id',
        'project_id',
        'office_id',
        'has_system_settings_access',
        'is_locked',
        'must_change_password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'has_system_settings_access' => 'boolean',
            'is_locked' => 'boolean',
            'must_change_password' => 'boolean',
        ];
    }

    /**
     * Primary organizational role (belongsTo relationship)
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Legacy many-to-many roles relationship (for backward compatibility)
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    /**
     * Helper function to check a role - checks both belongsTo and many-to-many
     */
    public function hasRole($roleName)
    {
        try {
            // Check primary role first
            if ($this->role && $this->role->name === $roleName) {
                return true;
            }
            // Fallback to many-to-many check
            return $this->roles()->where('name', $roleName)->exists();
        } catch (\Exception $e) {
            \Log::error('Error checking role: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user's position/designation
     */
    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    /**
     * Get user's project affiliation
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get user's office assignment
     */
    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    /**
     * Get user's employment types
     */
    public function employmentTypes()
    {
        return $this->belongsToMany(
            Employment::class,
            'users_employment_types',
            'user_id',
            'employment_type_id'
        );
    }

    /**
     * Get user's special capabilities (for JO employees)
     */
    public function specialCapabilities()
    {
        return $this->belongsToMany(
            SpecialCapability::class,
            'user_special_capabilities',
            'user_id',
            'capability_id'
        );
    }

    /**
     * Check if user is a Job Order employee
     */
    public function isJobOrder()
    {
        return $this->employmentTypes()
            ->where('name', 'JO')
            ->exists();
    }

    public function personalDataSheet()
    {
        return $this->hasOne(PersonalDataSheet::class);
    }

    /**
     * Get user's login activities
     */
    public function loginActivities()
    {
        return $this->hasMany(LoginActivity::class);
    }

    /**
     * Get user's module access logs
     */
    public function moduleAccessLogs()
    {
        return $this->hasMany(ModuleAccessLog::class);
    }

    /**
     * Get the full name attribute (combines first_name, middle_initial, last_name)
     * Falls back to 'name' field if name parts are not available
     */
    public function getFullNameAttribute()
    {
        if ($this->first_name || $this->last_name) {
            $parts = array_filter([
                $this->first_name,
                $this->middle_initial,
                $this->last_name
            ]);
            return implode(' ', $parts);
        }
        return $this->name ?? '';
    }

    /**
     * Set the name attribute and also populate name parts if not set
     */
    public function setNameAttribute($value)
    {
        $this->attributes['name'] = $value;
        // If name parts are not set, try to parse the name
        if (!$this->first_name && !$this->last_name && $value) {
            $parts = explode(' ', trim($value), 3);
            if (count($parts) >= 2) {
                $this->attributes['first_name'] = $parts[0];
                $this->attributes['last_name'] = $parts[count($parts) - 1];
                if (count($parts) === 3) {
                    $this->attributes['middle_initial'] = $parts[1];
                }
            }
        }
    }

    /**
     * Get the decrypted signature attribute
     */
    public function getSignatureAttribute($value)
    {
        if (!$value) {
            return null;
        }
        
        try {
            // Try to decrypt the signature
            return \Illuminate\Support\Facades\Crypt::decryptString($value);
        } catch (\Exception $e) {
            // If decryption fails (e.g., old unencrypted data), return as is
            \Log::warning('Failed to decrypt signature for user ' . $this->id . ': ' . $e->getMessage());
            return $value;
        }
    }

}
