<?php

namespace App\Http\Requests;

use App\Enums\FeedbackType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInspectionFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $comment = $this->comment ?? $this->notes;

        $type = $this->feedback_type;
        if (! $type && $this->user_assessment) {
            $assessment = strtolower($this->user_assessment);
            if ($assessment === 'accurate') {
                $type = 'other';
            } elseif ($assessment === 'partially_accurate') {
                $type = 'incorrect_class';
            } elseif ($assessment === 'inaccurate') {
                $type = 'false_positive';
            }
        }

        $merge = [];
        if ($comment !== null) {
            $merge['comment'] = $comment;
        }
        if ($type !== null) {
            $merge['feedback_type'] = $type;
        }

        if (! empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'feedback_type' => ['nullable', 'string', Rule::in(FeedbackType::values())],
            'user_assessment' => ['nullable', 'string', 'in:accurate,partially_accurate,inaccurate'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'agreed_grade' => ['nullable', 'string', 'in:A,B,C,D'],
        ];
    }

    public function messages(): array
    {
        return [
            'feedback_type.in' => 'Tipe feedback tidak valid (false_positive, false_negative, incorrect_class, other).',
        ];
    }
}
