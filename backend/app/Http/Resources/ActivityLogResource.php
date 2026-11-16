<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $properties = $this->properties ? $this->properties->toArray() : [];

        // Ensure sensitive tokens/passwords/secrets are stripped
        $this->sanitizeProperties($properties);

        return [
            'id' => $this->id,
            'log_name' => $this->log_name,
            'description' => $this->description,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'causer' => $this->causer ? [
                'id' => $this->causer->id,
                'name' => $this->causer->name ?? null,
                'email' => $this->causer->email ?? null,
            ] : null,
            'properties' => empty($properties) ? new \stdClass() : $properties,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    protected function sanitizeProperties(array &$data): void
    {
        $secretKeys = ['password', 'token', 'remember_token', 'secret', 'latitude', 'longitude', 'api_key'];

        foreach ($data as $key => &$value) {
            if (in_array(strtolower($key), $secretKeys, true)) {
                $value = '[REDACTED]';
            } elseif (is_array($value)) {
                $this->sanitizeProperties($value);
            }
        }
    }
}
