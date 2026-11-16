<?php

namespace App\Models;

use App\Enums\FeedbackReviewStatus;
use App\Enums\FeedbackType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Feedback pengguna atas hasil inspeksi. Bukan ground truth otomatis (PRD Bab 5.8).
 */
class InspectionFeedback extends Model
{
    use HasFactory;

    protected $table = 'inspection_feedback';

    protected $fillable = [
        'inspection_id',
        'submitted_by',
        'feedback_type',
        'comment',
        'review_status',
        'reviewed_by',
    ];

    protected function casts(): array
    {
        return [
            'feedback_type' => FeedbackType::class,
            'review_status' => FeedbackReviewStatus::class,
        ];
    }

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(MotorcycleInspection::class, 'inspection_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopePendingReview(Builder $query): Builder
    {
        return $query->where('review_status', FeedbackReviewStatus::Pending->value);
    }
}

