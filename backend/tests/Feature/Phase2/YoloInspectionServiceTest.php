<?php

namespace Tests\Feature\Phase2;

use App\Enums\InspectionStatus;
use App\Enums\SourceType;
use App\Enums\TaxStatus;
use App\Enums\VerificationStatus;
use App\Models\MotorcycleInspection;
use App\Models\MotorcycleModel;
use App\Models\User;
use App\Services\YoloInspectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class YoloInspectionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected YoloInspectionService $inspectionService;

    protected User $user;

    protected MotorcycleModel $motorcycleModel;

    protected function setUp(): void
    {
        parent::setUp();

        $this->inspectionService = app(YoloInspectionService::class);

        $this->user = User::factory()->create();
        $this->motorcycleModel = MotorcycleModel::create([
            'brand' => 'Honda',
            'model_name' => 'Vario 160 CBS',
            'category' => 'matic',
            'engine_cc' => 160,
            'standard_price' => 26500000,
            'is_active' => true,
        ]);
    }

    public function test_inspect_executes_real_yolo_pipeline_and_saves_inspection_record(): void
    {
        // Buat file gambar tes
        $uploadedFile = UploadedFile::fake()->image('vario_test.jpg', 640, 640);

        $inspection = $this->inspectionService->inspect(
            photo: $uploadedFile,
            userId: $this->user->id,
            motorcycleModelId: $this->motorcycleModel->id,
            year: 2023,
            odometerKm: 15000,
            taxStatus: TaxStatus::Active,
            sellerPrice: 22000000,
            sourceType: SourceType::WebUpload,
            metadata: [
                'latitude' => -8.6500000,
                'longitude' => 115.2166667,
            ]
        );

        $this->assertInstanceOf(MotorcycleInspection::class, $inspection);
        $this->assertSame(InspectionStatus::Completed, $inspection->inspection_status);
        $this->assertSame($this->user->id, $inspection->user_id);
        $this->assertSame('model_damage', $inspection->model_name);
        $this->assertSame('optimized_v2', $inspection->model_version);

        // Verifikasi media tersimpan
        $this->assertNotNull($inspection->getFirstMedia(MotorcycleInspection::MEDIA_RAW_PHOTO));

        // Verifikasi kalkulasi harga
        $this->assertGreaterThan(0, $inspection->base_depreciated_price);
        $this->assertGreaterThan(0, $inspection->ml_predicted_price);
        $this->assertIsArray($inspection->price_calculation_snapshot);
        $this->assertArrayHasKey('estimated_price', $inspection->price_calculation_snapshot);

        // Verifikasi activity log
        $hasLog = Activity::where('log_name', 'inspection')
            ->where('subject_id', $inspection->id)
            ->exists();
        $this->assertTrue($hasLog, 'Aktivitas inspeksi harus tercatat di Spatie ActivityLog.');
    }

    public function test_inspect_fails_gracefully_when_model_file_is_missing_without_faking_results(): void
    {
        Config::set('motolens.ml.model_path', 'non_existent_model.onnx');

        $uploadedFile = UploadedFile::fake()->image('fail_test.jpg', 640, 640);

        $inspection = $this->inspectionService->inspect(
            photo: $uploadedFile,
            userId: $this->user->id,
            motorcycleModelId: $this->motorcycleModel->id,
            year: 2023,
            odometerKm: 15000,
            taxStatus: TaxStatus::Active,
            sellerPrice: 20000000
        );

        $this->assertSame(InspectionStatus::Failed, $inspection->inspection_status);
        $this->assertSame('MODEL_FILE_NOT_FOUND', $inspection->error_code);
        $this->assertNull($inspection->ml_predicted_price, 'Hasil gagal TIDAK boleh memiliki prediksi harga palsu.');
        $this->assertSame(0, $inspection->total_damages_detected, 'Hasil gagal tidak boleh diisi deteksi palsu.');
    }

    public function test_verification_status_is_submitted_for_android_camera_with_coordinates(): void
    {
        $uploadedFile = UploadedFile::fake()->image('android_cam.jpg', 640, 640);

        $inspection = $this->inspectionService->inspect(
            photo: $uploadedFile,
            userId: $this->user->id,
            motorcycleModelId: $this->motorcycleModel->id,
            year: 2023,
            odometerKm: 10000,
            taxStatus: TaxStatus::Active,
            sellerPrice: 21000000,
            sourceType: SourceType::AndroidCamera,
            metadata: [
                'latitude' => -8.670458,
                'longitude' => 115.212629,
                'location_accuracy_m' => 12.5,
            ]
        );

        $this->assertSame(VerificationStatus::Submitted, $inspection->verification_status);
    }
}
