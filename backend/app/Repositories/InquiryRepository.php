<?php

namespace App\Repositories;

use App\Models\Inquiry;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class InquiryRepository
{
    /**
     * Mengambil daftar booking survei sebagai calon pembeli.
     */
    public function getByBuyer(int $buyerId, int $perPage = 15): LengthAwarePaginator
    {
        return Inquiry::query()
            ->with(['motorcycle.model', 'motorcycle.media', 'motorcycle.user:id,name'])
            ->where('buyer_id', $buyerId)
            ->orderBy('appointment_date', 'desc')
            ->paginate($perPage);
    }

    /**
     * Mengambil daftar booking survei yang masuk ke penjual.
     */
    public function getBySeller(int $sellerId, int $perPage = 15): LengthAwarePaginator
    {
        return Inquiry::query()
            ->with(['motorcycle.model', 'motorcycle.media', 'buyer:id,name,email'])
            ->whereHas('motorcycle', function (Builder $query) use ($sellerId) {
                $query->where('user_id', $sellerId);
            })
            ->orderBy('appointment_date', 'desc')
            ->paginate($perPage);
    }

    /**
     * Mengambil satu inquiry berdasarkan ID.
     */
    public function findById(int $id): ?Inquiry
    {
        return Inquiry::query()
            ->with(['motorcycle.model', 'motorcycle.media', 'buyer:id,name,email'])
            ->find($id);
    }
}

