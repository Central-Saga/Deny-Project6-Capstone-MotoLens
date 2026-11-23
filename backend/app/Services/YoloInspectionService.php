<?php

namespace App\Services;

use App\Enums\InspectionStatus;
use App\Enums\SourceType;
use App\Enums\TaxStatus;
use App\Enums\VerificationStatus;
use App\Models\MotorcycleInspection;
use App\Models\MotorcycleModel;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class YoloInspectionService
{
    public function __construct(
        protected PriceEstimationService $priceEstimationService
    ) {}

    /**
     * Menjalankan inspeksi ML nyata pada foto motor.
     * PRD v2.0.1 (Bab 3, Bab 4, Bab 7 Fase 2, Bab 19.6).
     *
     * @param  UploadedFile|string  $photo  File gambar yang diunggah atau path absolut
     * @param  int  $userId  ID pengguna pemilik inspeksi
     * @param  int  $motorcycleModelId  ID referensi model motor
     * @param  int  $year  Tahun perakitan kendaraan
     * @param  int  $odometerKm  Odometer dalam kilometer
     * @param  TaxStatus|string  $taxStatus  Status pajak aktif/expired
     * @param  int|null  $sellerPrice  Harga yang diminta penjual (opsional pada inspeksi awal)
     * @param  SourceType|string  $sourceType  Sumber pengambilan foto
     * @param  array  $metadata  Metadata lokasi & pengambilan
     */
    public function inspect(
        UploadedFile|string $photo,
        int $userId,
        int $motorcycleModelId,
        int $year,
        int $odometerKm,
        TaxStatus|string $taxStatus,
        ?int $sellerPrice = null,
        SourceType|string $sourceType = SourceType::WebUpload,
        array $metadata = []
    ): MotorcycleInspection {
        $sourceTypeEnum = $sourceType instanceof SourceType ? $sourceType : SourceType::from($sourceType);
        $taxStatusEnum = $taxStatus instanceof TaxStatus ? $taxStatus : TaxStatus::from($taxStatus);

        $modelConfig = config('motolens.ml');
        $modelPath = $modelConfig['model_path'] ?? storage_path('app/ml/model_damage.onnx');
        $expectedSha256 = $modelConfig['model_sha256'] ?? null;
        $pythonBinary = $modelConfig['python_binary'] ?? 'python';
        $confThreshold = (float) ($modelConfig['confidence_threshold'] ?? 0.35);
        $iouThreshold = (float) ($modelConfig['nms_iou_threshold'] ?? 0.45);
        $timeoutSeconds = (int) ($modelConfig['inference_timeout_seconds'] ?? 30);

        // Verifikasi keberadaan dan integritas model ONNX
        if (! File::exists($modelPath)) {
            return $this->createFailedInspection(
                userId: $userId,
                sourceType: $sourceTypeEnum,
                metadata: $metadata,
                errorCode: 'MODEL_FILE_NOT_FOUND',
                errorMessage: 'Artefak model ONNX tidak ditemukan di storage server.'
            );
        }

        if ($expectedSha256 && hash_file('sha256', $modelPath) !== strtolower($expectedSha256)) {
            return $this->createFailedInspection(
                userId: $userId,
                sourceType: $sourceTypeEnum,
                metadata: $metadata,
                errorCode: 'MODEL_SHA256_MISMATCH',
                errorMessage: 'Checksum SHA-256 model tidak cocok dengan spesifikasi PRD Bab 3.3.'
            );
        }

        // Tentukan verification status berdasarkan sumber foto & lokasi
        $verificationStatus = $this->determineVerificationStatus($sourceTypeEnum, $metadata);

        $imgSize = @getimagesize(is_string($photo) ? $photo : $photo->getRealPath());
        $initialWidth = $imgSize ? $imgSize[0] : null;
        $initialHeight = $imgSize ? $imgSize[1] : null;

        // Buat record inspeksi dengan status processing
        $inspection = MotorcycleInspection::create([
            'user_id' => $userId,
            'model_name' => $modelConfig['model_name'] ?? 'model_damage',
            'model_version' => $modelConfig['model_version'] ?? 'optimized_v2',
            'model_sha256' => $expectedSha256,
            'confidence_threshold' => $confThreshold,
            'nms_iou_threshold' => $iouThreshold,
            'source_type' => $sourceTypeEnum,
            'inspection_status' => InspectionStatus::Processing,
            'verification_status' => $verificationStatus,
            'image_width' => $initialWidth,
            'image_height' => $initialHeight,
            'latitude' => $metadata['latitude'] ?? null,
            'longitude' => $metadata['longitude'] ?? null,
            'location_accuracy_m' => $metadata['location_accuracy_m'] ?? null,
            'captured_at' => $metadata['captured_at'] ?? now(),
        ]);

        // Simpan foto mentah ke Spatie Media Library
        $rawMedia = is_string($photo)
            ? $inspection->addMedia($photo)->preservingOriginal()->toMediaCollection(MotorcycleInspection::MEDIA_RAW_PHOTO)
            : $inspection->addMedia($photo)->toMediaCollection(MotorcycleInspection::MEDIA_RAW_PHOTO);

        $rawPhotoPath = $rawMedia->getPath();

        // Siapkan path untuk foto anotasi sementara
        $tempDir = storage_path('app/temp');
        File::ensureDirectoryExists($tempDir);
        $annotatedTempPath = $tempDir.'/annotated_'.uniqid().'.jpg';

        $scriptPath = base_path('scripts/yolo_infer.py');

        // Jalankan eksekusi inferensi via Process
        $command = [
            $pythonBinary,
            $scriptPath,
            '--model', $modelPath,
            '--input', $rawPhotoPath,
            '--output', $annotatedTempPath,
            '--conf', (string) $confThreshold,
            '--iou', (string) $iouThreshold,
        ];

        try {
            $processResult = Process::timeout($timeoutSeconds)->run($command);
        } catch (\Throwable $e) {
            Log::error('YOLO inference process execution error', ['error' => $e->getMessage()]);
            $inspection->update([
                'inspection_status' => InspectionStatus::Failed,
                'error_code' => 'INFERENCE_TIMEOUT_OR_EXEC_FAIL',
                'error_message_safe' => 'Inferensi model melebihi batas waktu yang diizinkan atau gagal dieksekusi.',
            ]);

            return $inspection;
        }

        if (! $processResult->successful()) {
            $errorOutput = $processResult->errorOutput() ?: $processResult->output();
            Log::warning('YOLO inference returned non-zero code', ['output' => $errorOutput]);

            $jsonError = json_decode($processResult->output(), true);
            $inspection->update([
                'inspection_status' => InspectionStatus::Failed,
                'error_code' => $jsonError['error_code'] ?? 'INFERENCE_EXIT_CODE_'.$processResult->exitCode(),
                'error_message_safe' => $jsonError['error_message'] ?? 'Inferensi AI mendeteksi anomali pada gambar.',
            ]);

            return $inspection;
        }

        $inferenceData = json_decode($processResult->output(), true);
        if (! is_array($inferenceData) || ! ($inferenceData['success'] ?? false)) {
            $inspection->update([
                'inspection_status' => InspectionStatus::Failed,
                'error_code' => 'INVALID_JSON_OUTPUT',
                'error_message_safe' => 'Keluaran proses deteksi tidak sesuai kontrak sistem.',
            ]);

            return $inspection;
        }

        // Simpan foto anotasi jika berhasil dibuat
        $annotatedMediaId = null;
        if (File::exists($annotatedTempPath)) {
            $annotatedMedia = $inspection->addMedia($annotatedTempPath)
                ->toMediaCollection(MotorcycleInspection::MEDIA_ANNOTATED_PHOTO);
            $annotatedMediaId = $annotatedMedia->id;
            File::delete($annotatedTempPath);
        }

        // Ekstrak deteksi dan jumlah kerusakan per kelas
        $summary = $inferenceData['summary'] ?? [];
        $accidentCount = (int) ($summary['accident_count'] ?? 0);
        $dentCount = (int) ($summary['dent_count'] ?? 0);
        $scratchCount = (int) ($summary['scratch_count'] ?? 0);
        $totalDamages = (int) ($summary['total_detections'] ?? 0);
        $avgConfidence = (float) ($summary['average_confidence'] ?? 0.0);
        $inferenceTimeMs = (int) round($inferenceData['inference_time_ms'] ?? 0);
        $imageDims = $inferenceData['image'] ?? [];

        // Hitung estimasi harga transparan via PriceEstimationService
        $motorcycleModel = MotorcycleModel::findOrFail($motorcycleModelId);
        $priceCalculation = $this->priceEstimationService->calculate(
            standardPrice: $motorcycleModel->standard_price,
            vehicleYear: $year,
            odometerKm: $odometerKm,
            taxStatus: $taxStatusEnum,
            detectionCounts: [
                'Scratch' => $scratchCount,
                'Dent' => $dentCount,
                'Accident' => $accidentCount,
            ],
            sellerPrice: $sellerPrice
        );

        $basePrice = (int) ($priceCalculation['base_depreciated_price'] ?? 0);
        $mlPredictedPrice = (int) ($priceCalculation['estimated_price'] ?? 0);
        $damagePenaltyPercent = (float) ($priceCalculation['visual_penalty_percent'] ?? 0.0);

        // Update record inspeksi menjadi Completed
        $inspection->update([
            'inspection_status' => InspectionStatus::Completed,
            'raw_photo_media_id' => $rawMedia->id,
            'annotated_photo_media_id' => $annotatedMediaId,
            'image_width' => $imageDims['width'] ?? $initialWidth,
            'image_height' => $imageDims['height'] ?? $initialHeight,
            'scratch_count' => $scratchCount,
            'dent_count' => $dentCount,
            'accident_count' => $accidentCount,
            'total_damages_detected' => $totalDamages,
            'average_confidence' => $avgConfidence,
            'detections_json' => $inferenceData['detections'] ?? [],
            'inference_time_ms' => $inferenceTimeMs,
            'base_depreciated_price' => $basePrice,
            'ml_predicted_price' => $mlPredictedPrice,
            'damage_penalty_percent' => $damagePenaltyPercent,
            'price_calculation_snapshot' => $priceCalculation,
            'error_code' => null,
            'error_message_safe' => null,
        ]);

        // Catat metrik inferensi ke spatie/laravel-activitylog
        activity('inspection')
            ->performedOn($inspection)
            ->causedBy(User::find($userId))
            ->withProperties([
                'total_damages' => $totalDamages,
                'accident_count' => $accidentCount,
                'dent_count' => $dentCount,
                'scratch_count' => $scratchCount,
                'inference_time_ms' => $inferenceTimeMs,
                'model_version' => $modelConfig['model_version'] ?? 'optimized_v2',
                'ml_predicted_price' => $mlPredictedPrice,
            ])
            ->log('Inspeksi YOLO AI selesai dijalankan.');

        return $inspection;
    }

    /**
     * Memvalidasi status verifikasi berdasarkan aturan Bab 5.4, 5.5, 11.3 PRD.
     */
    protected function determineVerificationStatus(SourceType $sourceType, array $metadata): VerificationStatus
    {
        if ($sourceType === SourceType::AndroidCamera) {
            // Android camera dengan GPS koordinat valid
            if (isset($metadata['latitude'], $metadata['longitude']) && is_numeric($metadata['latitude']) && is_numeric($metadata['longitude'])) {
                return VerificationStatus::Submitted;
            }

            return VerificationStatus::Unverified;
        }

        if ($sourceType === SourceType::WebUpload) {
            return VerificationStatus::Unverified;
        }

        return VerificationStatus::Unverified;
    }

    /**
     * Membuat record inspeksi gagal tanpa faking hasil ML.
     */
    protected function createFailedInspection(
        int $userId,
        SourceType $sourceType,
        array $metadata,
        string $errorCode,
        string $errorMessage
    ): MotorcycleInspection {
        return MotorcycleInspection::create([
            'user_id' => $userId,
            'model_name' => config('motolens.ml.model_name', 'model_damage'),
            'model_version' => config('motolens.ml.model_version', 'optimized_v2'),
            'model_sha256' => config('motolens.ml.model_sha256'),
            'confidence_threshold' => (float) config('motolens.ml.confidence_threshold', 0.35),
            'nms_iou_threshold' => (float) config('motolens.ml.nms_iou_threshold', 0.45),
            'source_type' => $sourceType,
            'inspection_status' => InspectionStatus::Failed,
            'verification_status' => VerificationStatus::Unverified,
            'image_width' => $metadata['image_width'] ?? null,
            'image_height' => $metadata['image_height'] ?? null,
            'total_damages_detected' => 0,
            'scratch_count' => 0,
            'dent_count' => 0,
            'accident_count' => 0,
            'error_code' => $errorCode,
            'error_message_safe' => $errorMessage,
            'latitude' => $metadata['latitude'] ?? null,
            'longitude' => $metadata['longitude'] ?? null,
            'captured_at' => $metadata['captured_at'] ?? now(),
        ]);
    }
}
