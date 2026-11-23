<?php

namespace Database\Factories;

use App\Enums\InspectionStatus;
use App\Enums\SourceType;
use App\Enums\VerificationStatus;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\User;
use App\Services\PriceEstimationService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Inspeksi demo. Default `source_type = seed_demo`: data BUKAN hasil inferensi nyata
 * (PRD Bab 14.1). Karena itu `model_name/model_version = seed_demo`, `model_sha256`
 * kosong, `inference_time_ms` kosong, dan koordinat bbox bersifat sintetis.
 */
class MotorcycleInspectionFactory extends Factory
{
    protected $model = MotorcycleInspection::class;

    public const DEMO_IMAGE_WIDTH = 1280;

    public const DEMO_IMAGE_HEIGHT = 960;

    public function definition(): array
    {
        [$scratch, $dent, $accident] = MotorcycleFactory::damageScenario();
        [$detections, $average] = self::syntheticDetections($scratch, $dent, $accident);

        return [
            'motorcycle_id' => null,
            'user_id' => User::factory(),
            'model_name' => 'seed_demo',
            'model_version' => 'seed_demo',
            'model_sha256' => null,
            'confidence_threshold' => config('motolens.ml.confidence_threshold'),
            'nms_iou_threshold' => null,
            'source_type' => SourceType::SeedDemo,
            'inspection_status' => InspectionStatus::Completed,
            'image_width' => self::DEMO_IMAGE_WIDTH,
            'image_height' => self::DEMO_IMAGE_HEIGHT,
            'scratch_count' => $scratch,
            'dent_count' => $dent,
            'accident_count' => $accident,
            'average_confidence' => $average,
            'total_damages_detected' => $scratch + $dent + $accident,
            'detections_json' => $detections,
            'inference_time_ms' => null,
            'verification_status' => VerificationStatus::Unverified,
        ];
    }

    /**
     * Isi inspeksi dari listing: jumlah deteksi, harga, dan snapshot dihitung ulang dengan
     * PriceEstimationService (rumus yang sama dengan listing) agar konsisten.
     */
    public function forListing(Motorcycle $motorcycle, ?string $seedKey = null): static
    {
        $counts = [
            'Scratch' => $motorcycle->scratch_count,
            'Dent' => $motorcycle->dent_count,
            'Accident' => $motorcycle->accident_count,
        ];
        $standardPrice = $motorcycle->motorcycleModel()->value('standard_price');
        $breakdown = app(PriceEstimationService::class)->calculate(
            standardPrice: (int) $standardPrice,
            vehicleYear: $motorcycle->year,
            odometerKm: $motorcycle->odometer_km,
            taxStatus: $motorcycle->tax_status,
            detectionCounts: $counts,
            sellerPrice: $motorcycle->seller_price,
        );
        [$detections, $average] = self::syntheticDetections($counts['Scratch'], $counts['Dent'], $counts['Accident']);

        return $this->state(fn () => [
            'motorcycle_id' => $motorcycle->id,
            'user_id' => $motorcycle->user_id,
            'scratch_count' => $counts['Scratch'],
            'dent_count' => $counts['Dent'],
            'accident_count' => $counts['Accident'],
            'total_damages_detected' => array_sum($counts),
            'detections_json' => $detections,
            'average_confidence' => $average,
            'base_depreciated_price' => $breakdown['base_depreciated_price'],
            'ml_predicted_price' => $breakdown['estimated_price'],
            'damage_penalty_percent' => $breakdown['visual_penalty_percent'],
            'price_calculation_snapshot' => $breakdown + [
                'data_origin' => 'seed_demo',
                'is_real_inference' => false,
                'seed_key' => $seedKey,
            ],
            'created_at' => $motorcycle->created_at,
            'updated_at' => $motorcycle->created_at,
        ]);
    }

    public function androidCamera(): static
    {
        return $this->state(fn () => [
            'model_name' => config('motolens.ml.model_name'),
            'model_version' => config('motolens.ml.model_version'),
            'model_sha256' => config('motolens.ml.model_sha256'),
            'nms_iou_threshold' => config('motolens.ml.nms_iou_threshold'),
            'source_type' => SourceType::AndroidCamera,
            'verification_status' => VerificationStatus::Unverified,
        ]);
    }

    public function webUpload(): static
    {
        return $this->androidCamera()->state(fn () => [
            'source_type' => SourceType::WebUpload,
        ]);
    }

    /** Inspeksi gagal: bukan "nol kerusakan"; tanpa hasil deteksi/harga. */
    public function failed(string $errorCode = 'inference_failed'): static
    {
        return $this->state(fn () => [
            'inspection_status' => InspectionStatus::Failed,
            'scratch_count' => 0,
            'dent_count' => 0,
            'accident_count' => 0,
            'total_damages_detected' => 0,
            'average_confidence' => null,
            'detections_json' => null,
            'base_depreciated_price' => null,
            'ml_predicted_price' => null,
            'damage_penalty_percent' => null,
            'price_calculation_snapshot' => null,
            'error_code' => $errorCode,
            'error_message_safe' => 'Proses inferensi gagal. Silakan coba lagi.',
        ]);
    }

    /**
     * Deteksi SINTETIS untuk demo (kontrak PRD Bab 3.5: koordinat pixel pada gambar sumber).
     *
     * @return array{0:list<array<string,mixed>>,1:float|null}
     */
    public static function syntheticDetections(int $scratch, int $dent, int $accident): array
    {
        $threshold = (float) config('motolens.ml.confidence_threshold');
        $byClass = ['Accident' => $accident, 'Dent' => $dent, 'Scratch' => $scratch];
        $classIndex = array_flip(config('motolens.ml.class_names'));
        $w = self::DEMO_IMAGE_WIDTH;
        $h = self::DEMO_IMAGE_HEIGHT;

        $detections = [];
        foreach ($byClass as $name => $n) {
            for ($i = 0; $i < $n; $i++) {
                $bw = fake()->numberBetween(60, 260);
                $bh = fake()->numberBetween(50, 200);
                $x1 = fake()->numberBetween(0, $w - $bw);
                $y1 = fake()->numberBetween(0, $h - $bh);
                $detections[] = [
                    'class_index' => $classIndex[$name],
                    'class_name' => $name,
                    'confidence' => round(fake()->randomFloat(2, max($threshold, 0.36), 0.95), 2),
                    'bbox' => ['x1' => $x1, 'y1' => $y1, 'x2' => $x1 + $bw, 'y2' => $y1 + $bh],
                ];
            }
        }

        $average = $detections === []
            ? null
            : round(array_sum(array_column($detections, 'confidence')) / count($detections), 4);

        return [$detections, $average];
    }
}
