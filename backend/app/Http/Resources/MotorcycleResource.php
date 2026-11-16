<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MotorcycleResource extends JsonResource
{
    /**
     * Transform the resource into an array for catalog and comparison lists.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $mainPhotoUrl = null;
        if ($this->relationLoaded('media') || $this->media()->exists()) {
            $mainPhotoUrl = $this->getFirstMediaUrl(\App\Models\Motorcycle::MEDIA_MAIN_PHOTO);
            if (empty($mainPhotoUrl)) {
                $mainPhotoUrl = $this->getFirstMediaUrl();
            }
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'brand' => $this->motorcycleModel?->brand,
            'model_name' => $this->motorcycleModel?->model_name,
            'category' => $this->motorcycleModel?->category instanceof \BackedEnum
                ? $this->motorcycleModel->category->value
                : $this->motorcycleModel?->category,
            'engine_cc' => $this->motorcycleModel?->engine_cc,
            'year' => $this->year,
            'odometer_km' => $this->odometer_km,
            'tax_status' => $this->tax_status instanceof \BackedEnum ? $this->tax_status->value : $this->tax_status,
            'seller_price' => $this->seller_price,
            'base_depreciated_price' => $this->base_depreciated_price,
            'ml_predicted_price' => $this->ml_predicted_price,
            'price_label' => $this->price_label instanceof \BackedEnum ? $this->price_label->value : $this->price_label,
            'condition_grade' => $this->condition_grade instanceof \BackedEnum ? $this->condition_grade->value : $this->condition_grade,
            'location_address' => $this->location_address,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'moderation_status' => $this->moderation_status instanceof \BackedEnum ? $this->moderation_status->value : $this->moderation_status,
            'verification_status' => $this->verification_status instanceof \BackedEnum ? $this->verification_status->value : $this->verification_status,
            'is_camera_verified' => (bool) $this->is_camera_verified,
            'inspection_summary' => [
                'scratch_count' => (int) $this->scratch_count,
                'dent_count' => (int) $this->dent_count,
                'accident_count' => (int) $this->accident_count,
                'total_damages' => (int) ($this->scratch_count + $this->dent_count + $this->accident_count),
                'damage_penalty_percent' => (float) $this->damage_penalty_percent,
            ],
            'main_image_url' => $mainPhotoUrl ?: null,
            'seller' => [
                'id' => $this->seller?->id,
                'name' => $this->seller?->name,
                'phone_whatsapp' => $this->seller?->phone_whatsapp,
            ],
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
