<?php

namespace App\Repositories;

use App\Enums\ConditionGrade;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\PriceLabel;
use App\Models\Motorcycle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class MotorcycleRepository
{
    /**
     * Mengambil daftar katalog publik yang sudah disetujui (moderation_status = approved).
     * PRD v2.0.1 (Bab 6.3, 7 Fase 2, 10.2).
     */
    public function getPublicCatalog(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $perPage = max(1, min(50, $perPage));

        $query = Motorcycle::query()
            ->with(['model', 'media', 'user:id,name'])
            ->where('moderation_status', ModerationStatus::Approved->value);

        // Filter status unit (default: available dan booked)
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            $query->whereIn('status', [ListingStatus::Available->value, ListingStatus::Booked->value]);
        }

        // Filter brand / merk motor
        if (! empty($filters['brand'])) {
            $query->whereHas('model', function (Builder $q) use ($filters) {
                $q->where('brand', 'ilike', '%'.$filters['brand'].'%');
            });
        }

        // Filter model / nama tipe motor
        if (! empty($filters['model'])) {
            $query->whereHas('model', function (Builder $q) use ($filters) {
                $q->where('model_name', 'ilike', '%'.$filters['model'].'%');
            });
        }

        // Filter rentang harga penjual
        if (isset($filters['min_price']) && is_numeric($filters['min_price'])) {
            $query->where('seller_price', '>=', (int) $filters['min_price']);
        }
        if (isset($filters['max_price']) && is_numeric($filters['max_price'])) {
            $query->where('seller_price', '<=', (int) $filters['max_price']);
        }

        // Filter rentang tahun
        if (isset($filters['year_min']) && is_numeric($filters['year_min'])) {
            $query->where('year', '>=', (int) $filters['year_min']);
        }
        if (isset($filters['year_max']) && is_numeric($filters['year_max'])) {
            $query->where('year', '<=', (int) $filters['year_max']);
        }

        // Filter label harga
        if (! empty($filters['price_label'])) {
            $label = $filters['price_label'] instanceof PriceLabel
                ? $filters['price_label']->value
                : $filters['price_label'];
            $query->where('price_label', $label);
        }

        // Filter grade kondisi visual
        if (! empty($filters['condition_grade'])) {
            $grade = $filters['condition_grade'] instanceof ConditionGrade
                ? $filters['condition_grade']->value
                : $filters['condition_grade'];
            $query->where('condition_grade', $grade);
        }

        // Filter wilayah / lokasi
        if (! empty($filters['location'])) {
            $query->where('location_address', 'ilike', '%'.$filters['location'].'%');
        }

        // Pencarian teks umum (judul, deskripsi, brand, model)
        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where(function (Builder $q) use ($search) {
                $q->where('title', 'ilike', $search)
                    ->orWhere('description', 'ilike', $search)
                    ->orWhereHas('model', function (Builder $mq) use ($search) {
                        $mq->where('brand', 'ilike', $search)
                            ->orWhere('model_name', 'ilike', $search);
                    });
            });
        }

        // Sorting
        $sort = $filters['sort'] ?? 'newest';
        match ($sort) {
            'price_asc' => $query->orderBy('seller_price', 'asc'),
            'price_desc' => $query->orderBy('seller_price', 'desc'),
            'odometer_asc' => $query->orderBy('odometer_km', 'asc'),
            'year_desc' => $query->orderBy('year', 'desc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        return $query->paginate($perPage);
    }

    /**
     * Mengambil detail satu motor beserta relasi inspeksi, model, dan media.
     */
    public function findById(int $id): ?Motorcycle
    {
        return Motorcycle::query()
            ->with(['model', 'latestInspection', 'media', 'user:id,name'])
            ->find($id);
    }

    /**
     * Membandingkan 2–3 unit motor sekaligus.
     * PRD v2.0.1 (Bab 2.3, 6.3: /motorcycles/compare?ids=1,2,3).
     *
     * @param  array<int>  $ids
     * @return Collection<int, Motorcycle>
     */
    public function compare(array $ids): Collection
    {
        // Batasi maksimal 3 unit untuk komparasi sesuai Bab 2.3
        $safeIds = array_slice(array_unique(array_filter($ids, 'is_numeric')), 0, 3);

        if (empty($safeIds)) {
            return new Collection;
        }

        return Motorcycle::query()
            ->with(['model', 'latestInspection', 'media'])
            ->whereIn('id', $safeIds)
            ->where('moderation_status', ModerationStatus::Approved->value)
            ->get();
    }

    /**
     * Mengambil seluruh motor dalam garasi milik pengguna tertentu (termasuk status pending/rejected).
     */
    public function getUserGarage(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return Motorcycle::query()
            ->with(['model', 'latestInspection', 'media'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }
}
