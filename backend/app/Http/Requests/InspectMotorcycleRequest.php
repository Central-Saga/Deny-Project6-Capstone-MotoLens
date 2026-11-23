<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InspectMotorcycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxYear = now()->year + 1;

        return [
            'photo' => ['required', 'file', 'image', 'mimes:jpeg,png,jpg,webp', 'max:10240'],
            'motorcycle_model_id' => ['required', 'integer', 'exists:motorcycle_models,id'],
            'year' => ['required', 'integer', 'min:1990', "max:{$maxYear}"],
            'odometer_km' => ['required', 'integer', 'min:0', 'max:500000'],
            'tax_status' => ['required', 'string', 'in:active,expired'],
            'seller_price' => ['nullable', 'integer', 'min:500000', 'max:500000000'],
            'source_type' => ['nullable', 'string', 'in:android_camera,web_upload,seed_demo'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'location_accuracy_m' => ['nullable', 'numeric', 'min:0'],
            'captured_at' => ['nullable', 'date'],
            'capture_metadata' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'Foto motor wajib diunggah untuk menjalankan inspeksi.',
            'photo.image' => 'File yang diunggah harus berupa gambar yang valid.',
            'photo.max' => 'Ukuran foto maksimal adalah 10 MB.',
            'motorcycle_model_id.required' => 'Model motor wajib dipilih dari data referensi.',
            'motorcycle_model_id.exists' => 'Model motor yang dipilih tidak ditemukan.',
            'year.required' => 'Tahun pembuatan motor wajib diisi.',
            'odometer_km.required' => 'Jarak tempuh (odometer) wajib diisi.',
            'tax_status.required' => 'Status pajak (active/expired) wajib dipilih.',
        ];
    }
}
