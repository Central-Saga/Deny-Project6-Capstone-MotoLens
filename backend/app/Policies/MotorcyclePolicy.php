<?php

namespace App\Policies;

use App\Enums\ModerationStatus;
use App\Models\Motorcycle;
use App\Models\User;

class MotorcyclePolicy
{
    /**
     * Siapa pun (termasuk publik) dapat melihat katalog listing approved.
     */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    /**
     * Publik dapat melihat detail jika listing approved.
     * Pemilik atau admin dapat melihat detail dalam status apa pun.
     */
    public function view(?User $user, Motorcycle $motorcycle): bool
    {
        if ($motorcycle->moderation_status === ModerationStatus::Approved) {
            return true;
        }

        if ($user === null) {
            return false;
        }

        return $user->id === $motorcycle->user_id || $user->hasRole('admin');
    }

    /**
     * Setiap pengguna terautentikasi dapat membuat listing baru dari hasil inspeksi.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Hanya pemilik listing atau admin yang dapat memperbarui data/harga listing.
     */
    public function update(User $user, Motorcycle $motorcycle): bool
    {
        return $user->id === $motorcycle->user_id || $user->hasRole('admin');
    }

    /**
     * Hanya pemilik listing atau admin yang dapat menghapus/mengarsipkan listing.
     */
    public function delete(User $user, Motorcycle $motorcycle): bool
    {
        return $user->id === $motorcycle->user_id || $user->hasRole('admin');
    }

    /**
     * Hanya admin yang berhak melakukan moderasi listing.
     */
    public function moderate(User $user): bool
    {
        return $user->hasRole('admin');
    }
}
