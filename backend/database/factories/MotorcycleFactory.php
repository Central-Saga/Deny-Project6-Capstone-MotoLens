<?php

namespace Database\Factories;

use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\TaxStatus;
use App\Enums\VerificationStatus;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\MotorcycleModel;
use App\Models\User;
use App\Services\PriceEstimationService;
use Database\Seeders\Support\BaliLocations;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Listing bekas realistis di Bali. Kolom turunan (base_depreciated_price, ml_predicted_price,
 * damage_penalty_percent, price_label, condition_grade) SELALU dihitung memakai
 * PriceEstimationService (PRD Bab 4.3-4.7) dari atribut akhir, bukan diisi acak.
 * Setelah dibuat, satu inspeksi `seed_demo` dibuat dan ditautkan sebagai latest_inspection_id.
 *
 * @extends Factory<Motorcycle>
 */
class MotorcycleFactory extends Factory
{
    protected $model = Motorcycle::class;

    public function definition(): array
    {
        $currentYear = (int) now()->year;
        $vehicleYear = fake()->numberBetween($currentYear - 11, $currentYear);
        $age = $currentYear - $vehicleYear;
        $odometer = $age === 0
            ? fake()->numberBetween(300, 4000)
            : $age * fake()->numberBetween(6000, 14000) + fake()->numberBetween(0, 3000);
        $location = fake()->randomElement(BaliLocations::all());
        [$scratch, $dent, $accident] = self::damageScenario();
        $createdAt = fake()->dateTimeBetween('-90 days', '-1 day');

        return [
            'user_id' => User::factory(),
            'motorcycle_model_id' => MotorcycleModel::factory(),
            'title' => fn (array $a) => self::titleFor($a['motorcycle_model_id'], $vehicleYear, $location['area']),
            'description' => 'Unit demo MotoLens. Data inspeksi pada listing ini adalah data demo (seed_demo), bukan hasil inferensi nyata.',
            'year' => $vehicleYear,
            'odometer_km' => $odometer,
            'tax_status' => fake()->boolean(78) ? TaxStatus::Active : TaxStatus::Expired,
            'location_address' => BaliLocations::address($location),
            'latitude' => round($location['lat'] + fake()->randomFloat(4, -0.01, 0.01), 7),
            'longitude' => round($location['lng'] + fake()->randomFloat(4, -0.01, 0.01), 7),
            'scratch_count' => $scratch,
            'dent_count' => $dent,
            'accident_count' => $accident,
            'seller_price' => fn (array $a) => self::askingPrice($a, fake()->randomFloat(2, 0.85, 1.15)),
            'base_depreciated_price' => fn (array $a) => self::estimate($a)['base_depreciated_price'],
            'ml_predicted_price' => fn (array $a) => self::estimate($a)['estimated_price'],
            'damage_penalty_percent' => fn (array $a) => self::estimate($a)['visual_penalty_percent'],
            'price_label' => fn (array $a) => self::estimate($a, $a['seller_price'])['price_label'],
            'condition_grade' => fn (array $a) => self::estimate($a)['condition_grade'],
            'is_camera_verified' => false,
            'verification_status' => VerificationStatus::Unverified,
            'status' => ListingStatus::Available,
            'moderation_status' => ModerationStatus::Pending,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Motorcycle $motorcycle) {
            $inspection = MotorcycleInspection::factory()->forListing($motorcycle)->create();
            $motorcycle->forceFill(['latest_inspection_id' => $inspection->id])->saveQuietly();
        });
    }

    // ---- States

    public function forModel(MotorcycleModel $model): static
    {
        return $this->state(fn () => ['motorcycle_model_id' => $model->id]);
    }

    public function ownedBy(User $user): static
    {
        return $this->state(fn () => ['user_id' => $user->id]);
    }

    /** Harga penjual = rasio x estimasi sistem (dibulatkan ke Rp100.000). */
    public function askingRatio(float $ratio): static
    {
        return $this->state(fn () => ['seller_price' => fn (array $a) => self::askingPrice($a, $ratio)]);
    }

    public function withDamage(int $scratch, int $dent, int $accident): static
    {
        return $this->state(fn () => [
            'scratch_count' => $scratch,
            'dent_count' => $dent,
            'accident_count' => $accident,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn () => ['moderation_status' => ModerationStatus::Approved]);
    }

    public function pending(): static
    {
        return $this->state(fn () => ['moderation_status' => ModerationStatus::Pending]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['moderation_status' => ModerationStatus::Rejected]);
    }

    public function booked(): static
    {
        return $this->state(fn () => ['status' => ListingStatus::Booked]);
    }

    public function sold(): static
    {
        return $this->state(fn () => ['status' => ListingStatus::Sold]);
    }

    // ---- Helper (public static agar dapat dipakai factory inspeksi & seeder)

    /**
     * Skenario kerusakan visual bervariasi: [scratch, dent, accident].
     *
     * @return array{0:int,1:int,2:int}
     */
    public static function damageScenario(): array
    {
        $roll = fake()->numberBetween(1, 100);

        return match (true) {
            $roll <= 35 => [0, 0, 0],                                                       // mulus
            $roll <= 65 => [fake()->numberBetween(1, 3), 0, 0],                             // lecet ringan
            $roll <= 85 => [fake()->numberBetween(0, 3), fake()->numberBetween(1, 2), 0],   // perlu perbaikan
            default => [fake()->numberBetween(0, 2), fake()->numberBetween(0, 2), fake()->numberBetween(1, 2)],
        };
    }

    /**
     * Hitung breakdown dari atribut yang sudah diekspansi.
     *
     * @param  array<string,mixed>  $attributes
     * @return array<string,mixed>
     */
    public static function estimate(array $attributes, ?int $sellerPrice = null): array
    {
        $taxStatus = $attributes['tax_status'];

        return app(PriceEstimationService::class)->calculate(
            standardPrice: self::standardPrice((int) $attributes['motorcycle_model_id']),
            vehicleYear: (int) $attributes['year'],
            odometerKm: (int) $attributes['odometer_km'],
            taxStatus: $taxStatus,
            detectionCounts: [
                'Scratch' => (int) $attributes['scratch_count'],
                'Dent' => (int) $attributes['dent_count'],
                'Accident' => (int) $attributes['accident_count'],
            ],
            sellerPrice: $sellerPrice,
        );
    }

    /** @param array<string,mixed> $attributes */
    public static function askingPrice(array $attributes, float $ratio): int
    {
        $estimated = self::estimate($attributes)['estimated_price'];
        $price = (int) (round(($estimated * $ratio) / 100_000) * 100_000);

        return max(1_000_000, $price);
    }

    private static function standardPrice(int $modelId): int
    {
        return (int) MotorcycleModel::query()->whereKey($modelId)->value('standard_price');
    }

    private static function titleFor(int|string $modelId, int $year, string $area): string
    {
        $model = MotorcycleModel::query()->find($modelId);
        $notes = ['Terawat', 'Siap Pakai', 'Pajak Hidup', 'Service Rutin', 'Tangan Pertama', 'Nego Tipis'];

        $note = fake()->randomElement($notes);

        return mb_substr("{$model->brand} {$model->model_name} {$year} {$note} - {$area}", 0, 180);
    }
}

