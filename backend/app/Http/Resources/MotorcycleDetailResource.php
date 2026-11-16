<?php

namespace App\Http\Resources;

use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Services\PriceEstimationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MotorcycleDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array with Explainable Price Breakdown.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $inspection = $this->latestInspection;

        // Check if currently authenticated user has favorited this motorcycle
        $user = auth('sanctum')->user();
        $isFavorited = $user ? $this->favoritedBy()->where('user_id', $user->id)->exists() : false;

        // Build or extract explainable price breakdown
        $breakdown = $this->resolvePriceBreakdown($inspection);

        // Gather photos from Spatie Media Library
        $photos = [];
        $mainPhotoUrl = null;
        if ($this->relationLoaded('media') || $this->media()->exists()) {
            $mainMedia = $this->getFirstMedia(Motorcycle::MEDIA_MAIN_PHOTO) ?? $this->getFirstMedia();
            if ($mainMedia) {
                $mainPhotoUrl = $mainMedia->getUrl();
            }

            foreach ($this->getMedia(Motorcycle::MEDIA_MAIN_PHOTO) as $media) {
                $photos[] = [
                    'id' => $media->id,
                    'collection' => Motorcycle::MEDIA_MAIN_PHOTO,
                    'url' => $media->getUrl(),
                    'is_main' => true,
                ];
            }

            foreach ($this->getMedia(Motorcycle::MEDIA_ANGLE_PHOTOS) as $media) {
                $photos[] = [
                    'id' => $media->id,
                    'collection' => Motorcycle::MEDIA_ANGLE_PHOTOS,
                    'url' => $media->getUrl(),
                    'angle' => $media->getCustomProperty('angle'),
                    'is_main' => false,
                ];
            }

            foreach ($this->getMedia(Motorcycle::MEDIA_DAMAGE_DETAILS) as $media) {
                $photos[] = [
                    'id' => $media->id,
                    'collection' => Motorcycle::MEDIA_DAMAGE_DETAILS,
                    'url' => $media->getUrl(),
                    'damage_class' => $media->getCustomProperty('damage_class'),
                    'is_main' => false,
                ];
            }
        }

        // Inspection certificate info
        $certificate = null;
        if ($inspection) {
            $rawPhotoUrl = $inspection->getFirstMediaUrl(MotorcycleInspection::MEDIA_RAW_PHOTO) ?: null;
            $annotatedPhotoUrl = $inspection->getFirstMediaUrl(MotorcycleInspection::MEDIA_ANNOTATED_PHOTO) ?: null;

            $certificate = [
                'id' => $inspection->id,
                'certificate_number' => sprintf('ML-CERT-%04d-%06d', $inspection->created_at?->year ?? now()->year, $inspection->id),
                'inspected_at' => ($inspection->captured_at ?? $inspection->created_at)?->toISOString(),
                'model_name' => $inspection->model_name,
                'model_version' => $inspection->model_version,
                'model_sha256' => $inspection->model_sha256,
                'confidence_threshold' => (float) $inspection->confidence_threshold,
                'nms_iou_threshold' => (float) $inspection->nms_iou_threshold,
                'source_type' => $inspection->source_type instanceof \BackedEnum
                    ? $inspection->source_type->value
                    : $inspection->source_type,
                'verification_status' => $inspection->verification_status instanceof \BackedEnum
                    ? $inspection->verification_status->value
                    : $inspection->verification_status,
                'image_width' => $inspection->image_width ? (int) $inspection->image_width : null,
                'image_height' => $inspection->image_height ? (int) $inspection->image_height : null,
                'inference_time_ms' => $inspection->inference_time_ms,
                'annotated_image_url' => $annotatedPhotoUrl,
                'annotated_photo_url' => $annotatedPhotoUrl,
                'raw_image_url' => $rawPhotoUrl,
                'raw_photo_url' => $rawPhotoUrl,
                'detections' => $inspection->detections_json ?? [],
                'detections_json' => $inspection->detections_json ?? [],
                'counts' => [
                    'scratch' => (int) $inspection->scratch_count,
                    'dent' => (int) $inspection->dent_count,
                    'accident' => (int) $inspection->accident_count,
                    'total' => (int) $inspection->total_damages_detected,
                ],
            ];
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'model' => new MotorcycleModelResource($this->whenLoaded('motorcycleModel')),
            'brand' => $this->motorcycleModel?->brand,
            'model_name' => $this->motorcycleModel?->model_name,
            'category' => $this->motorcycleModel?->category instanceof \BackedEnum
                ? $this->motorcycleModel->category->value
                : $this->motorcycleModel?->category,
            'engine_cc' => $this->motorcycleModel?->engine_cc,
            'year' => $this->year,
            'odometer_km' => $this->odometer_km,
            'tax_status' => $this->tax_status instanceof \BackedEnum ? $this->tax_status->value : $this->tax_status,
            'location_address' => $this->location_address,
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'seller_price' => $this->seller_price,
            'base_depreciated_price' => $this->base_depreciated_price,
            'ml_predicted_price' => $this->ml_predicted_price,
            'price_label' => $this->price_label instanceof \BackedEnum ? $this->price_label->value : $this->price_label,
            'condition_grade' => $this->condition_grade instanceof \BackedEnum ? $this->condition_grade->value : $this->condition_grade,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'moderation_status' => $this->moderation_status instanceof \BackedEnum ? $this->moderation_status->value : $this->moderation_status,
            'verification_status' => $this->verification_status instanceof \BackedEnum ? $this->verification_status->value : $this->verification_status,
            'is_camera_verified' => (bool) $this->is_camera_verified,
            'damage_penalty_percent' => (float) $this->damage_penalty_percent,
            'is_favorited' => $isFavorited,
            'main_image_url' => $mainPhotoUrl ?: null,
            'photos' => $photos,
            'price_breakdown' => $breakdown,
            'price_histories' => ($this->relationLoaded('priceHistories') || $this->priceHistories()->exists())
                ? $this->priceHistories->map(fn ($h) => [
                    'id' => $h->id,
                    'old_price' => (int) $h->old_price,
                    'new_price' => (int) $h->new_price,
                    'changed_by' => $h->changed_by,
                    'created_at' => $h->created_at?->toISOString(),
                ])->values()->all()
                : [],
            'inspection_certificate' => $certificate,
            'seller' => [
                'id' => $this->seller?->id,
                'name' => $this->seller?->name,
                'phone_whatsapp' => $this->seller?->phone_whatsapp,
                'avatar_url' => $this->seller?->avatar_url,
            ],
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    /**
     * Resolve Explainable Price Breakdown (Bab 4.8).
     */
    protected function resolvePriceBreakdown(?MotorcycleInspection $inspection): array
    {
        $stdPrice = (int) ($this->motorcycleModel?->standard_price ?? $this->base_depreciated_price);
        $snapshot = $inspection?->price_calculation_snapshot;

        if ($snapshot && is_array($snapshot) && isset($snapshot['standard_price'])) {
            return [
                'standard_price' => (int) $snapshot['standard_price'],
                'vehicle_year' => (int) ($snapshot['vehicle_year'] ?? $this->year),
                'vehicle_age_years' => (int) ($snapshot['vehicle_age_years'] ?? max(0, now()->year - $this->year)),
                'age_depreciation_percent' => (float) ($snapshot['age_depreciation_percent'] ?? 0),
                'age_depreciation_amount' => (int) ($snapshot['age_depreciation_amount'] ?? 0),
                'odometer_km' => (int) ($snapshot['odometer_km'] ?? $this->odometer_km),
                'odometer_penalty' => (int) ($snapshot['odometer_penalty'] ?? 0),
                'tax_status' => (string) ($snapshot['tax_status'] ?? ($this->tax_status instanceof \BackedEnum ? $this->tax_status->value : $this->tax_status)),
                'tax_penalty' => (int) ($snapshot['tax_penalty'] ?? 0),
                'base_depreciated_price' => (int) ($snapshot['base_depreciated_price'] ?? $this->base_depreciated_price),
                'detection_counts' => [
                    'scratch' => (int) ($snapshot['detection_counts']['scratch'] ?? $this->scratch_count),
                    'dent' => (int) ($snapshot['detection_counts']['dent'] ?? $this->dent_count),
                    'accident' => (int) ($snapshot['detection_counts']['accident'] ?? $this->accident_count),
                ],
                'visual_penalty_per_class_percent' => $snapshot['visual_penalty_per_class_percent'] ?? [
                    'scratch' => 0.0,
                    'dent' => 0.0,
                    'accident' => 0.0,
                ],
                'visual_penalty_percent' => (float) ($snapshot['visual_penalty_percent'] ?? $this->damage_penalty_percent),
                'damage_penalty_percent' => (float) ($snapshot['visual_penalty_percent'] ?? $this->damage_penalty_percent),
                'ml_predicted_price' => (int) ($snapshot['estimated_price'] ?? $this->ml_predicted_price),
                'seller_price' => (int) $this->seller_price,
                'price_label' => $this->price_label instanceof \BackedEnum ? $this->price_label->value : $this->price_label,
                'condition_grade' => $this->condition_grade instanceof \BackedEnum ? $this->condition_grade->value : $this->condition_grade,
                'confidence_threshold' => (float) ($inspection->confidence_threshold ?? 0.35),
                'model_version' => (string) ($inspection->model_version ?? 'v1.0.0'),
            ];
        }

        // Fallback: calculate live with PriceEstimationService
        try {
            $estimator = app(PriceEstimationService::class);
            $calculated = $estimator->calculate(
                standardPrice: $stdPrice,
                vehicleYear: (int) $this->year,
                odometerKm: (int) $this->odometer_km,
                taxStatus: $this->tax_status,
                detectionCounts: [
                    'scratch' => (int) $this->scratch_count,
                    'dent' => (int) $this->dent_count,
                    'accident' => (int) $this->accident_count,
                ],
                sellerPrice: (int) $this->seller_price,
            );

            return [
                'standard_price' => (int) $calculated['standard_price'],
                'vehicle_year' => (int) $calculated['vehicle_year'],
                'vehicle_age_years' => (int) $calculated['vehicle_age_years'],
                'age_depreciation_percent' => (float) $calculated['age_depreciation_percent'],
                'age_depreciation_amount' => (int) $calculated['age_depreciation_amount'],
                'odometer_km' => (int) $calculated['odometer_km'],
                'odometer_penalty' => (int) $calculated['odometer_penalty'],
                'tax_status' => (string) $calculated['tax_status'],
                'tax_penalty' => (int) $calculated['tax_penalty'],
                'base_depreciated_price' => (int) $calculated['base_depreciated_price'],
                'detection_counts' => $calculated['detection_counts'],
                'visual_penalty_per_class_percent' => $calculated['visual_penalty_per_class_percent'],
                'visual_penalty_percent' => (float) $calculated['visual_penalty_percent'],
                'damage_penalty_percent' => (float) $calculated['visual_penalty_percent'],
                'ml_predicted_price' => (int) $calculated['estimated_price'],
                'seller_price' => (int) $this->seller_price,
                'price_label' => $calculated['price_label'] ?? ($this->price_label instanceof \BackedEnum ? $this->price_label->value : $this->price_label),
                'condition_grade' => $calculated['condition_grade'] ?? ($this->condition_grade instanceof \BackedEnum ? $this->condition_grade->value : $this->condition_grade),
                'confidence_threshold' => (float) ($inspection?->confidence_threshold ?? 0.35),
                'model_version' => (string) ($inspection?->model_version ?? 'v1.0.0'),
            ];
        } catch (\Throwable $e) {
            return [
                'standard_price' => $stdPrice,
                'vehicle_age_years' => max(0, now()->year - $this->year),
                'age_depreciation_percent' => 0.0,
                'age_depreciation_amount' => 0,
                'odometer_penalty' => 0,
                'tax_penalty' => 0,
                'base_depreciated_price' => (int) $this->base_depreciated_price,
                'detection_counts' => [
                    'scratch' => (int) $this->scratch_count,
                    'dent' => (int) $this->dent_count,
                    'accident' => (int) $this->accident_count,
                ],
                'confidence_threshold' => (float) ($inspection?->confidence_threshold ?? 0.35),
                'model_version' => (string) ($inspection?->model_version ?? 'v1.0.0'),
                'damage_penalty_percent' => (float) $this->damage_penalty_percent,
                'ml_predicted_price' => (int) $this->ml_predicted_price,
                'seller_price' => (int) $this->seller_price,
                'price_label' => $this->price_label instanceof \BackedEnum ? $this->price_label->value : $this->price_label,
                'condition_grade' => $this->condition_grade instanceof \BackedEnum ? $this->condition_grade->value : $this->condition_grade,
            ];
        }
    }
}
