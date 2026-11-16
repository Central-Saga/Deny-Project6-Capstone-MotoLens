<?php

namespace App\Http\Resources;

use App\Models\MotorcycleInspection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MotorcycleInspectionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $annotatedUrl = null;
        $rawUrl = null;

        if ($this->relationLoaded('media') || $this->media()->exists()) {
            $annotatedUrl = $this->getFirstMediaUrl(MotorcycleInspection::MEDIA_ANNOTATED_PHOTO);
            $rawUrl = $this->getFirstMediaUrl(MotorcycleInspection::MEDIA_RAW_PHOTO);
        }

        return [
            'id' => $this->id,
            'certificate_number' => sprintf('ML-CERT-%04d-%06d', $this->created_at?->year ?? now()->year, $this->id),
            'motorcycle_id' => $this->motorcycle_id,
            'user_id' => $this->user_id,
            'model_name' => $this->model_name,
            'model_version' => $this->model_version,
            'model_sha256' => $this->model_sha256,
            'confidence_threshold' => (float) $this->confidence_threshold,
            'nms_iou_threshold' => (float) $this->nms_iou_threshold,
            'source_type' => $this->source_type instanceof \BackedEnum ? $this->source_type->value : $this->source_type,
            'inspection_status' => $this->inspection_status instanceof \BackedEnum ? $this->inspection_status->value : $this->inspection_status,
            'scratch_count' => (int) $this->scratch_count,
            'dent_count' => (int) $this->dent_count,
            'accident_count' => (int) $this->accident_count,
            'total_damages_detected' => (int) $this->total_damages_detected,
            'average_confidence' => $this->average_confidence ? (float) $this->average_confidence : null,
            'inference_time_ms' => $this->inference_time_ms,
            'base_depreciated_price' => $this->base_depreciated_price,
            'ml_predicted_price' => $this->ml_predicted_price,
            'damage_penalty_percent' => (float) $this->damage_penalty_percent,
            'verification_status' => $this->verification_status instanceof \BackedEnum ? $this->verification_status->value : $this->verification_status,
            'annotated_image_url' => $annotatedUrl ?: null,
            'raw_image_url' => $rawUrl ?: null,
            'detections' => $this->detections_json ?? [],
            'price_breakdown' => $this->price_calculation_snapshot ?? [],
            'inspected_at' => ($this->captured_at ?? $this->created_at)?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
