<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motorcycle_id' => ['required', 'integer', 'exists:motorcycles,id'],
            'appointment_date' => ['required', 'date', 'after:now'],
            'offered_price' => ['nullable', 'integer', 'min:500000', 'max:500000000'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'motorcycle_id.required' => 'Unit motor yang ingin disurvei wajib dipilih.',
            'appointment_date.required' => 'Jadwal survei fisik wajib ditentukan.',
            'appointment_date.after' => 'Jadwal survei harus di waktu mendatang.',
        ];
    }
}

