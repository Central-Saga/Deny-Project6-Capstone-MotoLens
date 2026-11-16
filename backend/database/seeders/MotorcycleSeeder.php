<?php

namespace Database\Seeders;

use App\Enums\ModerationStatus;
use App\Models\Motorcycle;
use App\Models\MotorcycleModel;
use App\Models\MotorcyclePriceHistory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * 58 listing bekas demo di Bali: 52 approved + 5 pending + 1 rejected.
 * Nilai kalkulasi dihasilkan MotorcycleFactory -> PriceEstimationService (Bab 4.3-4.7).
 * Setiap listing punya satu inspeksi `seed_demo` (BUKAN inferensi nyata) dan foto placeholder
 * yang dibuat sendiri (gambar generik berlabel DEMO, tanpa hak cipta pihak ketiga).
 *
 * Idempotent: listing ditandai `seed_key` (di price_calculation_snapshot inspeksi);
 * menjalankan seeder berulang tidak menggandakan data.
 */
class MotorcycleSeeder extends Seeder
{
    public const TOTAL = 58;

    private const BASE_SEED = 20261116;

    /** Indeks listing dengan moderation_status khusus; sisanya approved. */
    public const PENDING_INDEXES = [8, 17, 26, 35, 44];

    public const REJECTED_INDEXES = [53];

    /** Status unit (hanya untuk listing approved). */
    public const BOOKED_INDEXES = [3, 12, 21, 30];

    public const SOLD_INDEXES = [5, 14, 23];

    public static function seedKey(int $index): string
    {
        return sprintf('seed-listing-%03d', $index);
    }

    public function run(): void
    {
        $models = MotorcycleModel::active()->orderBy('id')->get()->all();
        $owners = User::whereIn('email', [
            UserSeeder::USER_EMAIL,
            ...array_column(UserSeeder::EXTRA_USERS, 'email'),
        ])->orderBy('id')->get()->values();

        if ($models === [] || $owners->isEmpty()) {
            $this->command?->warn('MotorcycleModel/User belum tersedia; jalankan seeder referensi lebih dulu.');

            return;
        }

        activity()->disableLogging(); // data demo tidak perlu masuk audit log
        $created = 0;

        try {
            for ($i = 1; $i <= self::TOTAL; $i++) {
                $key = self::seedKey($i);

                if ($this->exists($key)) {
                    continue;
                }

                fake()->seed(self::BASE_SEED + $i); // deterministik per listing

                $factory = Motorcycle::factory()
                    ->forModel(fake()->randomElement($models))
                    ->ownedBy($owners[($i - 1) % $owners->count()])
                    ->askingRatio($this->askingRatio());

                $factory = match (true) {
                    in_array($i, self::PENDING_INDEXES, true) => $factory->pending(),
                    in_array($i, self::REJECTED_INDEXES, true) => $factory->rejected(),
                    default => $factory->approved(),
                };
                if (in_array($i, self::BOOKED_INDEXES, true)) {
                    $factory = $factory->booked();
                } elseif (in_array($i, self::SOLD_INDEXES, true)) {
                    $factory = $factory->sold();
                }

                /** @var Motorcycle $motorcycle */
                $motorcycle = $factory->create();

                // Tandai kunci seed pada snapshot inspeksi demo (identitas idempoten).
                $inspection = $motorcycle->latestInspection;
                $snapshot = $inspection->price_calculation_snapshot;
                $snapshot['seed_key'] = $key;
                $inspection->forceFill(['price_calculation_snapshot' => $snapshot])->saveQuietly();

                $this->attachPlaceholderPhoto($motorcycle, $i);

                if ($motorcycle->moderation_status === ModerationStatus::Approved && $i % 4 === 1) {
                    $this->addPriceHistory($motorcycle);
                }

                $created++;
            }
        } finally {
            activity()->enableLogging();
        }

        $this->command?->info("MotorcycleSeeder: {$created} listing baru (total seed ".$this->seededCount().').');
    }

    private function exists(string $key): bool
    {
        return \App\Models\MotorcycleInspection::query()
            ->where('source_type', 'seed_demo')
            ->where('price_calculation_snapshot->seed_key', $key)
            ->exists();
    }

    private function seededCount(): int
    {
        return \App\Models\MotorcycleInspection::query()
            ->where('source_type', 'seed_demo')
            ->whereNotNull('price_calculation_snapshot->seed_key')
            ->count();
    }

    /** ~30% good_deal, ~40% fair_price, ~30% overpriced (label tetap dihitung oleh rumus). */
    private function askingRatio(): float
    {
        $roll = fake()->numberBetween(1, 100);

        return match (true) {
            $roll <= 30 => fake()->randomFloat(2, 0.80, 0.93),
            $roll <= 70 => fake()->randomFloat(2, 0.96, 1.04),
            default => fake()->randomFloat(2, 1.07, 1.25),
        };
    }

    private function addPriceHistory(Motorcycle $motorcycle): void
    {
        $old = (int) (ceil($motorcycle->seller_price * fake()->randomFloat(2, 1.04, 1.10) / 100_000) * 100_000);
        if ($old <= $motorcycle->seller_price) {
            $old = $motorcycle->seller_price + 500_000;
        }

        $history = MotorcyclePriceHistory::create([
            'motorcycle_id' => $motorcycle->id,
            'old_price' => $old,
            'new_price' => $motorcycle->seller_price, // harga akhir = harga listing saat ini
            'changed_by' => $motorcycle->user_id,
        ]);
        $changedAt = fake()->dateTimeBetween($motorcycle->created_at, 'now');
        $history->forceFill(['created_at' => $changedAt, 'updated_at' => $changedAt])->saveQuietly();
    }

    /** Placeholder GD berlabel jelas: bukan foto motor sungguhan. */
    private function attachPlaceholderPhoto(Motorcycle $motorcycle, int $index): void
    {
        if (! function_exists('imagecreatetruecolor')) {
            $this->command?->warn('Ekstensi GD tidak tersedia; foto placeholder dilewati.');

            return;
        }

        $dir = storage_path('app/tmp-seed');
        File::ensureDirectoryExists($dir);
        $path = "{$dir}/demo-{$index}.jpg";

        $w = 800;
        $h = 600;
        $img = imagecreatetruecolor($w, $h);
        $hue = ($index * 37) % 360;
        [$r, $g, $b] = $this->hsl($hue, 0.35, 0.82);
        imagefilledrectangle($img, 0, 0, $w, $h, imagecolorallocate($img, $r, $g, $b));
        [$r, $g, $b] = $this->hsl($hue, 0.45, 0.35);
        $dark = imagecolorallocate($img, $r, $g, $b);
        imagefilledrectangle($img, 0, 0, $w, 70, $dark);
        imagefilledrectangle($img, 0, $h - 70, $w, $h, $dark);
        $white = imagecolorallocate($img, 255, 255, 255);

        $model = $motorcycle->motorcycleModel;
        imagestring($img, 5, 24, 26, 'MOTOLENS - FOTO PLACEHOLDER DEMO', $white);
        imagestring($img, 5, 24, 270, "{$model->brand} {$model->model_name} ({$motorcycle->year})", $dark);
        imagestring($img, 4, 24, 300, 'Bukan foto unit sebenarnya / bukan hasil kamera', $dark);
        imagestring($img, 4, 24, $h - 46, 'source_type: seed_demo', $white);
        imagejpeg($img, $path, 80);
        imagedestroy($img);

        $motorcycle->addMedia($path)
            ->usingFileName("demo-motor-{$index}.jpg")
            ->usingName("Placeholder demo {$index}")
            ->withCustomProperties(['angle' => 'front', 'order' => 1, 'is_placeholder' => true])
            ->toMediaCollection(Motorcycle::MEDIA_MAIN_PHOTO);
    }

    /** @return array{0:int,1:int,2:int} */
    private function hsl(float $h, float $s, float $l): array
    {
        $c = (1 - abs(2 * $l - 1)) * $s;
        $x = $c * (1 - abs(fmod($h / 60, 2) - 1));
        $m = $l - $c / 2;
        [$r, $g, $b] = match (true) {
            $h < 60 => [$c, $x, 0],
            $h < 120 => [$x, $c, 0],
            $h < 180 => [0, $c, $x],
            $h < 240 => [0, $x, $c],
            $h < 300 => [$x, 0, $c],
            default => [$c, 0, $x],
        };

        return [(int) round(($r + $m) * 255), (int) round(($g + $m) * 255), (int) round(($b + $m) * 255)];
    }
}

