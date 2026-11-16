<?php

namespace App\Http\Requests;

use App\Enums\MotorcycleCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMotorcycleModelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('category') && is_string($this->category)) {
            $this->merge([
                'category' => strtolower($this->category),
            ]);
        }

        if ($this->has('base_price') && ! $this->has('standard_price')) {
            $this->merge([
                'standard_price' => $this->base_price,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'brand' => ['required', 'string', 'max:50'],
            'model_name' => ['required', 'string', 'max:100'],
            'engine_cc' => ['required', 'integer', 'min:50', 'max:2000'],
            'category' => ['required', 'string', Rule::in(MotorcycleCategory::values())],
            'standard_price' => ['required', 'integer', 'min:1000000'],
            'price_source' => ['nullable', 'string', 'max:150'],
            'price_reference_date' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'brand.required' => 'Brand/merek motor wajib diisi.',
            'model_name.required' => 'Nama model motor wajib diisi.',
            'engine_cc.required' => 'Kapasitas mesin (cc) wajib diisi.',
            'category.required' => 'Kategori motor wajib dipilih (matic, sport, bebek, klasik).',
            'standard_price.required' => 'Harga standar acuan wajib diisi.',
        ];
    }
}
