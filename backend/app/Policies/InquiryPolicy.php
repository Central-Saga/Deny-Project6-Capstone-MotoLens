<?php

namespace App\Policies;

use App\Models\Inquiry;
use App\Models\User;

class InquiryPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Calon pembeli, penjual (pemilik motor), atau admin dapat melihat detail booking.
     */
    public function view(User $user, Inquiry $inquiry): bool
    {
        return $user->id === $inquiry->buyer_id ||
            $user->id === $inquiry->motorcycle->user_id ||
            $user->hasRole('admin');
    }

    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Penjual dapat menerima/menolak booking, pembeli dapat membatalkan, admin memiliki hak penuh.
     */
    public function update(User $user, Inquiry $inquiry): bool
    {
        return $user->id === $inquiry->buyer_id ||
            $user->id === $inquiry->motorcycle->user_id ||
            $user->hasRole('admin');
    }

    /**
     * Hanya admin yang dapat menghapus data inquiry.
     */
    public function delete(User $user, Inquiry $inquiry): bool
    {
        return $user->hasRole('admin');
    }
}
