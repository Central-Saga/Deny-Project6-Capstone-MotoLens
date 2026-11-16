<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InspectionFeedbackResource extends JsonResource
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
            'inspection_id' => $this->inspection_id,
            'inspection' => $this->inspection ? [
                'id' => $this->inspection->id,
                'model_name' => $this->inspection->model_name,
                'model_version' => $this->inspection->model_version,
                'scratch_count' => $this->inspection->scratch_count,
                'dent_count' => $this->inspection->dent_count,
                'accident_count' => $this->inspection->accident_count,
            ] : null,
            'submitter' => [
                'id' => $this->submitter?->id,
                'name' => $this->submitter?->name,
                'email' => $this->submitter?->email,
            ],
            'feedback_type' => $this->feedback_type instanceof \BackedEnum ? $this->feedback_type->value : $this->feedback_type,
            'comment' => $this->comment,
            'review_status' => $this->review_status instanceof \BackedEnum ? $this->review_status->value : $this->review_status,
            'reviewed_by' => $this->reviewed_by,
            'reviewer' => $this->reviewer ? [
                'id' => $this->reviewer->id,
                'name' => $this->reviewer->name,
            ] : null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

