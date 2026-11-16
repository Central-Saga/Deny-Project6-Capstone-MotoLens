<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc,filter', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone_whatsapp' => ['nullable', 'string', 'max:20', 'regex:/^(\+62|62|08)[0-9]{8,13}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar di MotoLens.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal harus 8 karakter.',
            'phone_whatsapp.regex' => 'Format nomor WhatsApp tidak valid (contoh: 08123456789 atau +628123456789).',
        ];
    }
}
