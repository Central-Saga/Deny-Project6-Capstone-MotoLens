<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = $this->data;

        return [
            'id' => (string) $this->id,
            'type' => $data['type'] ?? class_basename($this->type),
            'title' => $data['title'] ?? 'Pemberitahuan Sistem',
            'message' => $data['message'] ?? null,
            'data' => $data,
            'read_at' => $this->read_at ? $this->read_at->toISOString() : null,
            'is_read' => $this->read_at !== null,
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
        ];
    }
}

