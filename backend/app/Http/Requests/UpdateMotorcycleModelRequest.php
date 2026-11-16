<?php

namespace App\Http\Requests;

use App\Enums\MotorcycleCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMotorcycleModelRequest extends FormRequest
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
            'brand' => ['sometimes', 'required', 'string', 'max:50'],
            'model_name' => ['sometimes', 'required', 'string', 'max:100'],
            'engine_cc' => ['sometimes', 'required', 'integer', 'min:50', 'max:2000'],
            'category' => ['sometimes', 'required', 'string', Rule::in(MotorcycleCategory::values())],
            'standard_price' => ['sometimes', 'required', 'integer', 'min:1000000'],
            'price_source' => ['nullable', 'string', 'max:150'],
            'price_reference_date' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
