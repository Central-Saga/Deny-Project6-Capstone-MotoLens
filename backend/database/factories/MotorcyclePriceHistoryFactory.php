<?php

namespace Database\Factories;

use App\Models\Motorcycle;
use App\Models\MotorcyclePriceHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MotorcyclePriceHistory>
 */
class MotorcyclePriceHistoryFactory extends Factory
{
    protected $model = MotorcyclePriceHistory::class;

    public function definition(): array
    {
        $new = fake()->numberBetween(10, 30) * 1_000_000;

        return [
            'motorcycle_id' => Motorcycle::factory(),
            'old_price' => $new + fake()->numberBetween(1, 10) * 500_000,
            'new_price' => $new,
            'changed_by' => User::factory(),
        ];
    }
}
