<?php

namespace Tests\Feature\Phase3;

use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\PriceLabel;
use App\Enums\TaxStatus;
use App\Models\Motorcycle;
use App\Models\MotorcycleModel;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $regularUser;
    protected MotorcycleModel $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::create([
            'name' => 'Admin Utama',
            'email' => 'admin_test@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081234567831',
        ]);
        $this->admin->assignRole('admin');

        $this->regularUser = User::create([
            'name' => 'User Biasa',
            'email' => 'user_test@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081234567832',
        ]);
        $this->regularUser->assignRole('user');

        $this->model = MotorcycleModel::create([
            'brand' => 'Yamaha',
            'model_name' => 'Aerox 155 Connected',
            'engine_cc' => 155,
            'category' => 'matic',
            'standard_price' => 28000000,
            'is_active' => true,
        ]);
    }

    public function test_non_admin_user_is_strictly_forbidden_from_admin_endpoints(): void
    {
        $userToken = $this->regularUser->createToken('user_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$userToken}")
            ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_access_dashboard_overview_and_metrics(): void
    {
        Motorcycle::create([
            'user_id' => $this->regularUser->id,
            'motorcycle_model_id' => $this->model->id,
            'title' => 'Yamaha Aerox Approved',
            'year' => 2022,
            'odometer_km' => 10000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Denpasar, Bali',
            'seller_price' => 24000000,
            'base_depreciated_price' => 25000000,
            'ml_predicted_price' => 24500000,
            'price_label' => PriceLabel::FairPrice->value,
            'condition_grade' => 'mulus',
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);

        $adminToken = $this->admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Data ringkasan dashboard admin berhasil diambil.',
            ])
            ->assertJsonStructure([
                'data' => [
                    'overview' => [
                        'total_listings',
                        'approved_listings',
                        'pending_moderation',
                        'total_catalog_value',
                    ],
                    'price_label_distribution',
                    'condition_grade_distribution',
                    'damage_detection_stats',
                ],
            ]);
    }

    public function test_admin_can_list_and_moderate_listing(): void
    {
        $motorcycle = Motorcycle::create([
            'user_id' => $this->regularUser->id,
            'motorcycle_model_id' => $this->model->id,
            'title' => 'Motor Pending Moderasi',
            'year' => 2022,
            'odometer_km' => 10000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Denpasar, Bali',
            'seller_price' => 24000000,
            'base_depreciated_price' => 25000000,
            'ml_predicted_price' => 24500000,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Pending->value,
        ]);

        $adminToken = $this->admin->createToken('admin_token')->plainTextToken;

        // List moderation
        $resList = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/v1/admin/motorcycles?moderation_status=pending');
        $resList->assertStatus(200)->assertJsonCount(1, 'data');

        // Approve listing
        $resApprove = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->patchJson("/api/v1/admin/motorcycles/{$motorcycle->id}/moderation", [
                'moderation_status' => 'approved',
            ]);

        $resApprove->assertStatus(200)
            ->assertJsonPath('data.moderation_status', 'approved');

        $this->assertSame(ModerationStatus::Approved, $motorcycle->fresh()->moderation_status);

        // Reject listing
        $resReject = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->patchJson("/api/v1/admin/motorcycles/{$motorcycle->id}/moderation", [
                'moderation_status' => 'rejected',
                'rejection_reason' => 'Foto plat nomor dan bodi samping tidak jelas.',
            ]);

        $resReject->assertStatus(200)
            ->assertJsonPath('data.moderation_status', 'rejected');

        $this->assertSame(ModerationStatus::Rejected, $motorcycle->fresh()->moderation_status);
    }

    public function test_admin_can_crud_master_motorcycle_models(): void
    {
        $adminToken = $this->admin->createToken('admin_token')->plainTextToken;

        // Create
        $resCreate = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/v1/admin/motorcycle-models', [
                'brand' => 'Kawasaki',
                'model_name' => 'Ninja ZX-25R',
                'engine_cc' => 250,
                'category' => 'sport',
                'standard_price' => 105000000,
                'price_source' => 'Kawasaki Bali Dealer OTR',
            ]);

        $resCreate->assertStatus(201)
            ->assertJsonPath('data.brand', 'Kawasaki')
            ->assertJsonPath('data.model_name', 'Ninja ZX-25R');

        $modelId = $resCreate->json('data.id');

        $this->app['auth']->forgetGuards();

        // Update
        $resUpdate = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/v1/admin/motorcycle-models/{$modelId}", [
                'standard_price' => 108000000,
            ]);

        $resUpdate->assertStatus(200)
            ->assertJsonPath('data.standard_price', 108000000);

        $this->app['auth']->forgetGuards();

        // Delete
        $resDelete = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->deleteJson("/api/v1/admin/motorcycle-models/{$modelId}");

        $resDelete->assertStatus(200);

        $this->assertDatabaseMissing('motorcycle_models', ['id' => $modelId]);
    }

    public function test_admin_can_view_inspection_metrics(): void
    {
        $adminToken = $this->admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/v1/admin/inspections/metrics');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_inspections',
                    'completed_inspections',
                    'failed_inspections',
                    'inference_time_ms' => ['average', 'min', 'max'],
                    'accuracy_metrics' => [
                        'average_confidence',
                        'detections_by_class' => ['scratch', 'dent', 'accident', 'total'],
                    ],
                ],
            ]);
    }

    public function test_admin_can_view_activity_logs_without_secret_leakage(): void
    {
        Activity::create([
            'log_name' => 'test_audit',
            'description' => 'User changed password',
            'causer_type' => User::class,
            'causer_id' => $this->regularUser->id,
            'properties' => [
                'password' => 'secret_password_123',
                'token' => 'plain_text_token_123',
                'action' => 'update_profile',
            ],
        ]);

        $adminToken = $this->admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/v1/admin/activity-logs?log_name=test_audit');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $props = $response->json('data.0.properties');
        $this->assertSame('[REDACTED]', $props['password']);
        $this->assertSame('[REDACTED]', $props['token']);
        $this->assertSame('update_profile', $props['action']);
    }
}
