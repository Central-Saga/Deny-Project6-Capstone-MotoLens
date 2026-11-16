<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MotorcycleModelResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'brand' => $this->brand,
            'model_name' => $this->model_name,
            'engine_cc' => $this->engine_cc,
            'category' => $this->category instanceof \BackedEnum ? $this->category->value : $this->category,
            'standard_price' => $this->standard_price,
            'base_price' => $this->standard_price,
            'price_source' => $this->price_source,
            'price_reference_date' => $this->price_reference_date?->format('Y-m-d'),
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
