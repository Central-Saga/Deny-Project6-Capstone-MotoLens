<?php

namespace App\Services;

use App\Enums\ConditionGrade;
use App\Enums\InspectionStatus;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\PriceLabel;
use App\Enums\SourceType;
use App\Enums\VerificationStatus;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\MotorcycleModel;
use App\Models\MotorcyclePriceHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MotorcycleService
{
    public function __construct(
        protected PriceEstimationService $priceEstimationService
    ) {}

    /**
     * Menerbitkan iklan listing dari hasil inspeksi yang telah selesai.
     * PRD v2.0.1 (Bab 5.4, 5.5, 7 Fase 2, 10.1).
     *
     * @param  int  $inspectionId  ID inspeksi yang valid dan Completed
     * @param  int  $userId  ID pengguna penerbit listing
     * @param  array  $data  Data tambahan listing (title, description, seller_price, location, etc.)
     */
    public function publishFromInspection(int $inspectionId, int $userId, array $data): Motorcycle
    {
        $inspection = MotorcycleInspection::with('user')->findOrFail($inspectionId);

        if ($inspection->user_id !== $userId) {
            throw ValidationException::withMessages([
                'inspection_id' => ['Hanya pemilik inspeksi yang dapat menerbitkan iklan.'],
            ]);
        }

        if ($inspection->inspection_status !== InspectionStatus::Completed) {
            throw ValidationException::withMessages([
                'inspection_id' => ['Iklan hanya dapat diterbitkan dari inspeksi yang berstatus completed.'],
            ]);
        }

        if ($inspection->motorcycle_id !== null) {
            throw ValidationException::withMessages([
                'inspection_id' => ['Hasil inspeksi ini sudah pernah diterbitkan sebagai listing.'],
            ]);
        }

        $snapshot = $inspection->price_calculation_snapshot ?? [];
        $vehicleData = $snapshot['vehicle'] ?? [];
        $breakdown = $snapshot['breakdown'] ?? [];

        $modelId = $data['motorcycle_model_id'] ?? ($vehicleData['model_id'] ?? null);
        if (! $modelId) {
            throw ValidationException::withMessages([
                'motorcycle_model_id' => ['Model motor wajib disertakan.'],
            ]);
        }

        $year = (int) ($data['year'] ?? ($vehicleData['year'] ?? now()->year));
        $odometerKm = (int) ($data['odometer_km'] ?? ($vehicleData['odometer_km'] ?? 0));
        $taxStatus = $data['tax_status'] ?? ($vehicleData['tax_status'] ?? 'active');

        $sellerPrice = (int) ($data['seller_price'] ?? ($inspection->base_depreciated_price));
        $mlPredictedPrice = (int) ($inspection->ml_predicted_price ?? $sellerPrice);

        // Hitung ulang price label berdasarkan seller price aktual terhadap ML predicted price
        $priceLabel = $this->priceEstimationService->labelFor($sellerPrice, $mlPredictedPrice) ?? PriceLabel::FairPrice;

        // Ambil condition grade dari snapshot atau kalkulasi
        $conditionGradeStr = $snapshot['condition_grade'] ?? null;
        $conditionGrade = $conditionGradeStr
            ? ConditionGrade::tryFrom($conditionGradeStr)
            : $this->priceEstimationService->gradeFor(
                (int) ($inspection->total_damages_detected ?? 0),
                (int) round(((float) ($inspection->damage_penalty_percent ?? 0)) * 100)
            );

        $isCameraVerified = ($inspection->source_type === SourceType::AndroidCamera &&
            $inspection->verification_status === VerificationStatus::Verified);

        return DB::transaction(function () use (
            $userId,
            $modelId,
            $data,
            $year,
            $odometerKm,
            $taxStatus,
            $inspection,
            $sellerPrice,
            $mlPredictedPrice,
            $priceLabel,
            $conditionGrade,
            $isCameraVerified
        ): Motorcycle {
            // Buat listing motor baru
            $motorcycle = Motorcycle::create([
                'user_id' => $userId,
                'motorcycle_model_id' => $modelId,
                'title' => $data['title'] ?? 'Motor Bekas Terinspeksi AI',
                'description' => $data['description'] ?? null,
                'year' => $year,
                'odometer_km' => $odometerKm,
                'tax_status' => $taxStatus,
                'location_address' => $data['location_address'] ?? 'Denpasar, Bali',
                'latitude' => $inspection->latitude ?? ($data['latitude'] ?? null),
                'longitude' => $inspection->longitude ?? ($data['longitude'] ?? null),
                'seller_price' => $sellerPrice,
                'base_depreciated_price' => $inspection->base_depreciated_price,
                'ml_predicted_price' => $mlPredictedPrice,
                'price_label' => $priceLabel,
                'condition_grade' => $conditionGrade,
                'scratch_count' => $inspection->scratch_count,
                'dent_count' => $inspection->dent_count,
                'accident_count' => $inspection->accident_count,
                'damage_penalty_percent' => $inspection->damage_penalty_percent,
                'latest_inspection_id' => $inspection->id,
                'is_camera_verified' => $isCameraVerified,
                'verification_status' => $inspection->verification_status,
                'status' => ListingStatus::Available,
                'moderation_status' => ModerationStatus::Pending,
            ]);

            // Hubungkan inspeksi ke motorcycle
            $inspection->update(['motorcycle_id' => $motorcycle->id]);

            // Salin media dari inspeksi ke koleksi listing
            $rawPhoto = $inspection->getFirstMedia(MotorcycleInspection::MEDIA_RAW_PHOTO);
            if ($rawPhoto && file_exists($rawPhoto->getPath())) {
                $motorcycle->addMedia($rawPhoto->getPath())
                    ->preservingOriginal()
                    ->toMediaCollection(Motorcycle::MEDIA_MAIN_PHOTO);
            }

            $annotatedPhoto = $inspection->getFirstMedia(MotorcycleInspection::MEDIA_ANNOTATED_PHOTO);
            if ($annotatedPhoto && file_exists($annotatedPhoto->getPath())) {
                $motorcycle->addMedia($annotatedPhoto->getPath())
                    ->preservingOriginal()
                    ->toMediaCollection(Motorcycle::MEDIA_DAMAGE_DETAILS);
            }

            // Catat riwayat harga pertama kali
            MotorcyclePriceHistory::create([
                'motorcycle_id' => $motorcycle->id,
                'old_price' => null,
                'new_price' => $sellerPrice,
                'changed_by' => $userId,
            ]);

            activity('listing')
                ->performedOn($motorcycle)
                ->causedBy($userId)
                ->withProperties([
                    'seller_price' => $sellerPrice,
                    'ml_predicted_price' => $mlPredictedPrice,
                    'price_label' => $priceLabel->value,
                    'inspection_id' => $inspection->id,
                ])
                ->log('Listing motor baru berhasil diterbitkan dari hasil inspeksi AI.');

            return $motorcycle;
        });
    }

    /**
     * Memperbarui harga yang diminta penjual dan mencatat riwayat perubahan.
     */
    public function updateSellerPrice(Motorcycle $motorcycle, int $newPrice, int $userId): Motorcycle
    {
        if ($newPrice <= 0) {
            throw ValidationException::withMessages([
                'seller_price' => ['Harga penjual harus lebih besar dari nol.'],
            ]);
        }

        $oldPrice = $motorcycle->seller_price;
        if ($oldPrice === $newPrice) {
            return $motorcycle;
        }

        // Hitung ulang price label terhadap ML predicted price
        $newLabel = $this->priceEstimationService->labelFor($newPrice, $motorcycle->ml_predicted_price) ?? PriceLabel::FairPrice;

        $motorcycle->update([
            'seller_price' => $newPrice,
            'price_label' => $newLabel,
        ]);

        // Catat ke MotorcyclePriceHistory
        MotorcyclePriceHistory::create([
            'motorcycle_id' => $motorcycle->id,
            'old_price' => $oldPrice,
            'new_price' => $newPrice,
            'changed_by' => $userId,
        ]);

        activity('listing')
            ->performedOn($motorcycle)
            ->causedBy($userId)
            ->withProperties([
                'old_price' => $oldPrice,
                'new_price' => $newPrice,
                'price_label' => $newLabel->value,
            ])
            ->log('Harga listing diperbarui oleh penjual.');

        return $motorcycle;
    }

    /**
     * Moderasi listing oleh admin.
     */
    public function moderateListing(
        Motorcycle $motorcycle,
        ModerationStatus|string $status,
        ?string $rejectionReason = null,
        ?string $notes = null,
        ?int $adminId = null
    ): Motorcycle {
        $statusEnum = $status instanceof ModerationStatus ? $status : ModerationStatus::from($status);

        $motorcycle->update([
            'moderation_status' => $statusEnum,
        ]);

        activity('moderation')
            ->performedOn($motorcycle)
            ->causedBy($adminId)
            ->withProperties([
                'status' => $statusEnum->value,
                'reason' => $rejectionReason,
                'notes' => $notes,
            ])
            ->log("Listing dimoderasi menjadi: {$statusEnum->value}");

        return $motorcycle;
    }
}
