<?php

namespace Database\Seeders;

use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Models\User;
use Database\Factories\InquiryFactory;
use Illuminate\Database\Seeder;

/**
 * Contoh inquiry (jadwal survei) + favorit. Selaras dengan status listing:
 *  - listing `booked`  -> inquiry `accepted`
 *  - listing `sold`    -> inquiry `completed`
 *  - beberapa listing `available` -> pending/rejected/cancelled
 * Pembeli tidak pernah pemilik listing (PRD Bab 5.7). Idempotent per (listing, pembeli).
 */
class InquirySeeder extends Seeder
{
    public function run(): void
    {
        $buyers = User::whereIn('email', [
            UserSeeder::USER_EMAIL,
            ...array_column(UserSeeder::EXTRA_USERS, 'email'),
        ])->orderBy('id')->get()->values();

        if ($buyers->count() < 2) {
            $this->command?->warn('User demo belum tersedia; InquirySeeder dilewati.');

            return;
        }

        activity()->disableLogging();

        try {
            fake()->seed(20261117);
            $approved = Motorcycle::query()->approved()->orderBy('id');

            $booked = (clone $approved)->withStatus(ListingStatus::Booked)->get();
            $sold = (clone $approved)->withStatus(ListingStatus::Sold)->get();
            $available = (clone $approved)->available()->get();

            foreach ($booked as $i => $motorcycle) {
                $this->make($motorcycle, $buyers, $i, fn (InquiryFactory $f) => $f->accepted());
            }
            foreach ($sold as $i => $motorcycle) {
                $this->make($motorcycle, $buyers, $i, fn (InquiryFactory $f) => $f->completed());
            }

            // Variasi status pada listing tersedia: 4 pending, 1 rejected, 1 cancelled.
            $plan = ['pending', 'pending', 'pending', 'pending', 'rejected', 'cancelled'];
            foreach ($plan as $i => $state) {
                $motorcycle = $available->get($i * 3);
                if ($motorcycle === null) {
                    continue;
                }
                $this->make($motorcycle, $buyers, $i + 1, fn (InquiryFactory $f) => match ($state) {
                    'rejected' => $f->rejected(),
                    'cancelled' => $f->cancelled(),
                    default => $f,
                });
            }

            // Favorit: user demo menyukai 5 listing milik orang lain.
            $demo = $buyers->firstWhere('email', UserSeeder::USER_EMAIL);
            $favorites = $available->where('user_id', '!=', $demo->id)->take(5)->pluck('id');
            $demo->favoriteMotorcycles()->syncWithoutDetaching($favorites->all());
        } finally {
            activity()->enableLogging();
        }
    }

    private function make(Motorcycle $motorcycle, $buyers, int $offset, callable $state): void
    {
        $candidates = $buyers->where('id', '!=', $motorcycle->user_id)->values();
        $buyer = $candidates[$offset % $candidates->count()];

        if (Inquiry::where('motorcycle_id', $motorcycle->id)->where('buyer_id', $buyer->id)->exists()) {
            return;
        }

        $factory = $state(Inquiry::factory());
        $offered = fake()->boolean(50)
            ? (int) (round($motorcycle->seller_price * fake()->randomFloat(2, 0.92, 0.99) / 100_000) * 100_000)
            : null;

        $factory->create([
            'motorcycle_id' => $motorcycle->id,
            'buyer_id' => $buyer->id,
            'offered_price' => $offered,
        ]);
    }
}

