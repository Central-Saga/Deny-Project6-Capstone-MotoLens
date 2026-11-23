<?php

namespace Database\Factories;

use App\Enums\MotorcycleCategory;
use App\Models\MotorcycleModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MotorcycleModel>
 */
class MotorcycleModelFactory extends Factory
{
    protected $model = MotorcycleModel::class;

    public function definition(): array
    {
        return [
            'brand' => fake()->randomElement(['Honda', 'Yamaha', 'Suzuki', 'Kawasaki']),
            'model_name' => 'Test '.fake()->unique()->bothify('??-###'),
            'engine_cc' => fake()->randomElement([110, 125, 150, 155, 160]),
            'category' => fake()->randomElement(MotorcycleCategory::cases()),
            'standard_price' => fake()->numberBetween(15, 40) * 1_000_000,
            'price_source' => 'Data uji factory (bukan referensi pasar)',
            'price_reference_date' => now()->toDateString(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
