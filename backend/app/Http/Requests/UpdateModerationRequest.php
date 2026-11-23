<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateModerationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'moderation_status' => ['required', 'string', 'in:approved,rejected'],
            'rejection_reason' => ['required_if:moderation_status,rejected', 'nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'moderation_status.required' => 'Status moderasi (approved/rejected) wajib ditentukan.',
            'rejection_reason.required_if' => 'Alasan penolakan wajib disertakan jika listing ditolak.',
        ];
    }
}
