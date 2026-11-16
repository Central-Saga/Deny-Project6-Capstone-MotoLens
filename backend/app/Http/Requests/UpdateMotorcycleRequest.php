<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMotorcycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'seller_price' => ['nullable', 'integer', 'min:500000', 'max:500000000'],
            'location_address' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:available,booked,sold'],
        ];
    }
}

