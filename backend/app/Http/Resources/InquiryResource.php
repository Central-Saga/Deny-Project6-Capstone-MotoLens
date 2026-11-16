<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InquiryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $motorcycle = $this->motorcycle;
        $mainPhotoUrl = null;
        if ($motorcycle && ($motorcycle->relationLoaded('media') || $motorcycle->media()->exists())) {
            $mainPhotoUrl = $motorcycle->getFirstMediaUrl(\App\Models\Motorcycle::MEDIA_MAIN_PHOTO)
                ?: $motorcycle->getFirstMediaUrl();
        }

        return [
            'id' => $this->id,
            'motorcycle_id' => $this->motorcycle_id,
            'motorcycle' => $motorcycle ? [
                'id' => $motorcycle->id,
                'title' => $motorcycle->title,
                'brand' => $motorcycle->motorcycleModel?->brand,
                'model_name' => $motorcycle->motorcycleModel?->model_name,
                'year' => $motorcycle->year,
                'seller_price' => $motorcycle->seller_price,
                'location_address' => $motorcycle->location_address,
                'main_image_url' => $mainPhotoUrl ?: null,
            ] : null,
            'buyer' => [
                'id' => $this->buyer?->id,
                'name' => $this->buyer?->name,
                'phone_whatsapp' => $this->buyer?->phone_whatsapp,
            ],
            'seller' => [
                'id' => $motorcycle?->seller?->id,
                'name' => $motorcycle?->seller?->name,
                'phone_whatsapp' => $motorcycle?->seller?->phone_whatsapp,
            ],
            'appointment_date' => $this->appointment_date?->toISOString(),
            'offered_price' => $this->offered_price,
            'notes' => $this->notes,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'seller_response_at' => $this->seller_response_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
