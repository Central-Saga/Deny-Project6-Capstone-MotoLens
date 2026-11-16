<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMotorcycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'inspection_id' => ['required', 'integer', 'exists:motorcycle_inspections,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'seller_price' => ['required', 'integer', 'min:500000', 'max:500000000'],
            'location_address' => ['required', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    public function messages(): array
    {
        return [
            'inspection_id.required' => 'ID inspeksi wajib disertakan untuk menerbitkan iklan.',
            'inspection_id.exists' => 'Data inspeksi tidak ditemukan.',
            'title.required' => 'Judul iklan motor wajib diisi.',
            'seller_price.required' => 'Harga yang diminta penjual wajib diisi.',
            'location_address.required' => 'Lokasi motor di Bali wajib dicantumkan.',
        ];
    }
}

