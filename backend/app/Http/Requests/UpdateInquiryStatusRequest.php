<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInquiryStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('status')) {
            $status = strtolower($this->status);
            if ($status === 'confirmed' || $status === 'approved') {
                $status = 'accepted';
            }
            $this->merge(['status' => $status]);
        }
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:pending,accepted,rejected,completed,cancelled'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status survei wajib diisi.',
            'status.in' => 'Status survei tidak valid (pilihan: accepted, rejected, completed, cancelled).',
        ];
    }
}
