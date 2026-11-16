<?php

namespace App\Policies;

use App\Models\MotorcycleInspection;
use App\Models\User;

class MotorcycleInspectionPolicy
{
    /**
     * Tentukan apakah user dapat melihat daftar inspeksi.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Memastikan hanya pemilik inspeksi atau admin yang dapat mengakses detail inspeksi.
     */
    public function view(User $user, MotorcycleInspection $inspection): bool
    {
        return $user->id === $inspection->user_id || $user->hasRole('admin');
    }

    /**
     * Setiap user terautentikasi dapat membuat inspeksi baru.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Memberikan feedback pada hasil inspeksi.
     */
    public function feedback(User $user, MotorcycleInspection $inspection): bool
    {
        return $user->id === $inspection->user_id || $user->hasRole('admin');
    }
}
