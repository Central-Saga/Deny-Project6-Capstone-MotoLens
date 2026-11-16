<?php

namespace Tests\Feature\Phase3;

use App\Models\MotorcycleModel;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GeneralApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_health_check_endpoint_returns_healthy_status(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'healthy',
                    'version' => 'v1.0.0',
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'checks' => [
                        'database',
                        'cache',
                        'ml_model',
                        'python',
                    ],
                ],
            ]);
    }

    public function test_motorcycle_models_public_index_returns_active_models(): void
    {
        MotorcycleModel::create([
            'brand' => 'Honda',
            'model_name' => 'BeAT CBS',
            'engine_cc' => 110,
            'category' => 'matic',
            'standard_price' => 18000000,
            'is_active' => true,
        ]);

        MotorcycleModel::create([
            'brand' => 'Honda',
            'model_name' => 'Model Lama Nonaktif',
            'engine_cc' => 100,
            'category' => 'bebek',
            'standard_price' => 12000000,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/motorcycle-models');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Daftar model referensi berhasil diambil.',
            ])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.model_name', 'BeAT CBS');
    }
}
