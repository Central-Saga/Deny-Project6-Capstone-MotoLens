<?php

namespace Database\Factories;

use App\Enums\FeedbackReviewStatus;
use App\Enums\FeedbackType;
use App\Models\InspectionFeedback;
use App\Models\MotorcycleInspection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InspectionFeedback>
 */
class InspectionFeedbackFactory extends Factory
{
    protected $model = InspectionFeedback::class;

    public function definition(): array
    {
        return [
            'inspection_id' => MotorcycleInspection::factory(),
            'submitted_by' => User::factory(),
            'feedback_type' => fake()->randomElement(FeedbackType::cases()),
            'comment' => 'Feedback uji dari factory.',
            'review_status' => FeedbackReviewStatus::Pending,
            'reviewed_by' => null,
        ];
    }
}
