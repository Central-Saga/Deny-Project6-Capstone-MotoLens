<?php

namespace Tests\Feature\Phase3;

use App\Enums\InspectionStatus;
use App\Enums\SourceType;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\MotorcycleModel;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InspectionApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $otherUser;
    protected User $admin;
    protected MotorcycleModel $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->user = User::create([
            'name' => 'Inspection Owner',
            'email' => 'owner@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081234567801',
        ]);
        $this->user->assignRole('user');

        $this->otherUser = User::create([
            'name' => 'Stranger User',
            'email' => 'stranger@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081234567802',
        ]);
        $this->otherUser->assignRole('user');

        $this->admin = User::create([
            'name' => 'Admin Super',
            'email' => 'admin_super@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081234567803',
        ]);
        $this->admin->assignRole('admin');

        $this->model = MotorcycleModel::create([
            'brand' => 'Honda',
            'model_name' => 'Scoopy Prestige',
            'engine_cc' => 110,
            'category' => 'matic',
            'standard_price' => 22000000,
            'is_active' => true,
        ]);
    }

    public function test_user_can_inspect_motorcycle_with_multipart_photo(): void
    {
        $token = $this->user->createToken('user_token')->plainTextToken;

        $file = UploadedFile::fake()->image('scooter.jpg', 640, 640);

        $payload = [
            'photo' => $file,
            'motorcycle_model_id' => $this->model->id,
            'year' => 2022,
            'odometer_km' => 12000,
            'tax_status' => 'active',
            'seller_price' => 18000000,
            'source_type' => 'android_camera',
            'latitude' => -8.6705,
            'longitude' => 115.2126,
            'location_accuracy_m' => 8.5,
            'captured_at' => now()->toDateTimeString(),
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/v1/motorcycles/inspect', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Inspeksi AI bodi motor berhasil diselesaikan.',
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'certificate_number',
                    'model_name',
                    'model_version',
                    'confidence_threshold',
                    'scratch_count',
                    'dent_count',
                    'accident_count',
                    'ml_predicted_price',
                    'inference_time_ms',
                    'verification_status',
                ],
            ]);

        $this->assertDatabaseHas('motorcycle_inspections', [
            'user_id' => $this->user->id,
            'source_type' => SourceType::AndroidCamera->value,
        ]);
    }

    public function test_owner_and_admin_can_view_inspection_while_stranger_is_forbidden(): void
    {
        $inspection = MotorcycleInspection::create([
            'user_id' => $this->user->id,
            'model_name' => 'yolov8n-damage-v1.0.0',
            'model_version' => 'v1.0.0',
            'confidence_threshold' => 0.35,
            'nms_iou_threshold' => 0.45,
            'source_type' => 'web_upload',
            'inspection_status' => InspectionStatus::Completed->value,
            'scratch_count' => 1,
            'dent_count' => 0,
            'accident_count' => 0,
            'total_damages_detected' => 1,
            'inference_time_ms' => 380,
            'base_depreciated_price' => 18000000,
            'ml_predicted_price' => 17640000,
            'damage_penalty_percent' => 2.0,
        ]);

        $ownerToken = $this->user->createToken('owner_token')->plainTextToken;
        $strangerToken = $this->otherUser->createToken('stranger_token')->plainTextToken;
        $adminToken = $this->admin->createToken('admin_token')->plainTextToken;

        // Owner can view
        $resOwner = $this->withHeader('Authorization', "Bearer {$ownerToken}")
            ->getJson("/api/v1/inspections/{$inspection->id}");
        $resOwner->assertStatus(200)->assertJsonPath('data.id', $inspection->id);

        $this->app['auth']->forgetGuards();

        // Stranger is forbidden
        $resStranger = $this->withHeader('Authorization', "Bearer {$strangerToken}")
            ->getJson("/api/v1/inspections/{$inspection->id}");
        $resStranger->assertStatus(403)->assertJsonPath('success', false);

        $this->app['auth']->forgetGuards();

        // Admin can view
        $resAdmin = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson("/api/v1/inspections/{$inspection->id}");
        $resAdmin->assertStatus(200)->assertJsonPath('data.id', $inspection->id);
    }

    public function test_owner_can_view_unit_inspection_history(): void
    {
        $motorcycle = Motorcycle::create([
            'user_id' => $this->user->id,
            'motorcycle_model_id' => $this->model->id,
            'title' => 'Scoopy History Test',
            'year' => 2022,
            'odometer_km' => 10000,
            'tax_status' => 'active',
            'location_address' => 'Denpasar, Bali',
            'seller_price' => 18000000,
            'base_depreciated_price' => 19000000,
            'ml_predicted_price' => 18500000,
            'status' => 'available',
            'moderation_status' => 'approved',
        ]);

        $insp1 = MotorcycleInspection::create([
            'motorcycle_id' => $motorcycle->id,
            'user_id' => $this->user->id,
            'model_name' => 'yolov8n-damage-v1.0.0',
            'model_version' => 'v1.0.0',
            'confidence_threshold' => 0.35,
            'nms_iou_threshold' => 0.45,
            'source_type' => 'web_upload',
            'inspection_status' => 'completed',
            'scratch_count' => 1,
            'dent_count' => 0,
            'accident_count' => 0,
            'total_damages_detected' => 1,
            'inference_time_ms' => 300,
            'base_depreciated_price' => 18000000,
            'ml_predicted_price' => 17640000,
            'damage_penalty_percent' => 2.0,
        ]);

        $ownerToken = $this->user->createToken('owner_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$ownerToken}")
            ->getJson("/api/v1/motorcycles/{$motorcycle->id}/inspections");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $insp1->id);
    }

    public function test_user_can_submit_inspection_feedback(): void
    {
        $inspection = MotorcycleInspection::create([
            'user_id' => $this->user->id,
            'model_name' => 'yolov8n-damage-v1.0.0',
            'model_version' => 'v1.0.0',
            'confidence_threshold' => 0.35,
            'nms_iou_threshold' => 0.45,
            'source_type' => 'web_upload',
            'inspection_status' => 'completed',
            'scratch_count' => 2,
            'dent_count' => 0,
            'accident_count' => 0,
            'total_damages_detected' => 2,
            'inference_time_ms' => 320,
            'base_depreciated_price' => 18000000,
            'ml_predicted_price' => 17280000,
            'damage_penalty_percent' => 4.0,
        ]);

        $token = $this->user->createToken('user_token')->plainTextToken;

        $payload = [
            'feedback_type' => 'false_positive',
            'comment' => 'Baret di bagian bodi samping sebenarnya adalah pantulan stiker.',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/inspections/{$inspection->id}/feedback", $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Feedback inspeksi berhasil dikirim dan akan ditinjau tim QA/ML.',
            ])
            ->assertJsonPath('data.feedback_type', 'false_positive');

        $this->assertDatabaseHas('inspection_feedback', [
            'inspection_id' => $inspection->id,
            'submitted_by' => $this->user->id,
            'feedback_type' => 'false_positive',
        ]);
    }
}
