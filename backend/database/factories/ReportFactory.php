<?php

namespace Database\Factories;

use App\Enums\ReportStatus;
use App\Models\Motorcycle;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Report>
 */
class ReportFactory extends Factory
{
    protected $model = Report::class;

    public function definition(): array
    {
        return [
            'motorcycle_id' => Motorcycle::factory(),
            'reporter_id' => User::factory(),
            'reason' => fake()->randomElement(['Foto tidak sesuai', 'Harga tidak wajar', 'Iklan duplikat', 'Lainnya']),
            'description' => null,
            'status' => ReportStatus::Open,
            'reviewed_by' => null,
        ];
    }
}

