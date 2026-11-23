<?php

namespace Database\Factories;

use App\Enums\InquiryStatus;
use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Inquiry>
 */
class InquiryFactory extends Factory
{
    protected $model = Inquiry::class;

    public function definition(): array
    {
        return [
            'motorcycle_id' => Motorcycle::factory(),
            'buyer_id' => User::factory(),
            'appointment_date' => fake()->dateTimeBetween('+2 days', '+14 days')->setTime(fake()->numberBetween(9, 16), fake()->randomElement([0, 30])),
            'offered_price' => null,
            'notes' => 'Ingin survei unit dan cek kondisi langsung.',
            'status' => InquiryStatus::Pending,
            'seller_response_at' => null,
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn () => ['status' => InquiryStatus::Accepted, 'seller_response_at' => now()]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['status' => InquiryStatus::Rejected, 'seller_response_at' => now()]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => InquiryStatus::Cancelled]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => InquiryStatus::Completed,
            'appointment_date' => fake()->dateTimeBetween('-20 days', '-2 days'),
            'seller_response_at' => now()->subDays(25),
        ]);
    }
}
