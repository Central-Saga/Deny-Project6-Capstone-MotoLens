<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    /**
     * Role (`admin`/`user`) sengaja TIDAK ada di $fillable: registrasi publik
     * tidak boleh menetapkan role admin (PRD Bab 6.2 & 11.1).
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone_whatsapp',
        'avatar_url',
    ];

    /** @var list<string> */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function motorcycles(): HasMany
    {
        return $this->hasMany(Motorcycle::class);
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(MotorcycleInspection::class);
    }

    /** Inquiry yang diajukan user sebagai pembeli. */
    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class, 'buyer_id');
    }

    public function favoriteMotorcycles(): BelongsToMany
    {
        return $this->belongsToMany(Motorcycle::class, 'motorcycle_favorites')->withTimestamps();
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }
}
