<?php

namespace Tests\Feature\Phase3;

use App\Enums\ConditionGrade;
use App\Enums\InspectionStatus;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\PriceLabel;
use App\Enums\TaxStatus;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\MotorcycleModel;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CatalogAndMotorcycleApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $seller;
    protected User $otherUser;
    protected MotorcycleModel $modelHonda;
    protected MotorcycleModel $modelYamaha;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->seller = User::create([
            'name' => 'Seller One',
            'email' => 'seller@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081234567891',
        ]);
        $this->seller->assignRole('user');

        $this->otherUser = User::create([
            'name' => 'Buyer Two',
            'email' => 'buyer@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081234567892',
        ]);
        $this->otherUser->assignRole('user');

        $this->modelHonda = MotorcycleModel::create([
            'brand' => 'Honda',
            'model_name' => 'Vario 160 CBS',
            'engine_cc' => 160,
            'category' => 'matic',
            'standard_price' => 27000000,
            'is_active' => true,
        ]);

        $this->modelYamaha = MotorcycleModel::create([
            'brand' => 'Yamaha',
            'model_name' => 'NMAX 155 Connected',
            'engine_cc' => 155,
            'category' => 'matic',
            'standard_price' => 32000000,
            'is_active' => true,
        ]);
    }

    public function test_public_catalog_returns_only_approved_listings_with_pagination(): void
    {
        // 1 Approved listing
        $approved = Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelHonda->id,
            'title' => 'Honda Vario 160 Mulus',
            'description' => 'Motor istimewa tangan pertama',
            'year' => 2022,
            'odometer_km' => 15000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Denpasar Selatan, Bali',
            'seller_price' => 22000000,
            'base_depreciated_price' => 23000000,
            'ml_predicted_price' => 22500000,
            'price_label' => PriceLabel::FairPrice->value,
            'condition_grade' => ConditionGrade::Mulus->value,
            'scratch_count' => 1,
            'dent_count' => 0,
            'accident_count' => 0,
            'damage_penalty_percent' => 2.0,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);

        // 1 Pending listing
        Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelYamaha->id,
            'title' => 'Yamaha NMAX Pending',
            'description' => 'Motor baru diajukan',
            'year' => 2023,
            'odometer_km' => 5000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Badung, Bali',
            'seller_price' => 29000000,
            'base_depreciated_price' => 30000000,
            'ml_predicted_price' => 29500000,
            'price_label' => PriceLabel::FairPrice->value,
            'condition_grade' => ConditionGrade::Mulus->value,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Pending->value,
        ]);

        $response = $this->getJson('/api/v1/motorcycles');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Katalog motor berhasil diambil.',
            ])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $approved->id);
    }

    public function test_public_catalog_filters_by_brand_and_price_and_sorts(): void
    {
        Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelHonda->id,
            'title' => 'Honda Vario 160 2022',
            'year' => 2022,
            'odometer_km' => 15000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Denpasar, Bali',
            'seller_price' => 20000000,
            'base_depreciated_price' => 23000000,
            'ml_predicted_price' => 22000000,
            'price_label' => PriceLabel::GoodDeal->value,
            'condition_grade' => ConditionGrade::Mulus->value,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);

        Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelYamaha->id,
            'title' => 'Yamaha NMAX 2023',
            'year' => 2023,
            'odometer_km' => 8000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Badung, Bali',
            'seller_price' => 28000000,
            'base_depreciated_price' => 29000000,
            'ml_predicted_price' => 28000000,
            'price_label' => PriceLabel::FairPrice->value,
            'condition_grade' => ConditionGrade::Mulus->value,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);

        // Filter by Brand Honda
        $resHonda = $this->getJson('/api/v1/motorcycles?brand=Honda');
        $resHonda->assertStatus(200)->assertJsonCount(1, 'data');
        $this->assertSame('Honda', $resHonda->json('data.0.brand'));

        // Filter by price range
        $resPrice = $this->getJson('/api/v1/motorcycles?min_price=25000000');
        $resPrice->assertStatus(200)->assertJsonCount(1, 'data');
        $this->assertSame('Yamaha', $resPrice->json('data.0.brand'));
    }

    public function test_motorcycle_compare_accepts_2_or_3_units(): void
    {
        $moto1 = Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelHonda->id,
            'title' => 'Motor 1',
            'year' => 2022,
            'odometer_km' => 10000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Denpasar, Bali',
            'seller_price' => 21000000,
            'base_depreciated_price' => 23000000,
            'ml_predicted_price' => 22000000,
            'price_label' => PriceLabel::FairPrice->value,
            'condition_grade' => ConditionGrade::Mulus->value,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);

        $moto2 = Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelYamaha->id,
            'title' => 'Motor 2',
            'year' => 2023,
            'odometer_km' => 12000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Badung, Bali',
            'seller_price' => 29000000,
            'base_depreciated_price' => 30000000,
            'ml_predicted_price' => 28500000,
            'price_label' => PriceLabel::FairPrice->value,
            'condition_grade' => ConditionGrade::Mulus->value,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);

        $response = $this->getJson("/api/v1/motorcycles/compare?ids={$moto1->id},{$moto2->id}");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_motorcycle_compare_validates_required_ids_count(): void
    {
        $resSingle = $this->getJson('/api/v1/motorcycles/compare?ids=1');
        $resSingle->assertStatus(422)
            ->assertJsonPath('success', false);

        $resTooMany = $this->getJson('/api/v1/motorcycles/compare?ids=1,2,3,4');
        $resTooMany->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_motorcycle_detail_includes_explainable_price_breakdown(): void
    {
        $inspection = MotorcycleInspection::create([
            'user_id' => $this->seller->id,
            'model_name' => 'yolov8n-damage-v1.0.0',
            'model_version' => 'v1.0.0',
            'confidence_threshold' => 0.35,
            'nms_iou_threshold' => 0.45,
            'source_type' => 'web_upload',
            'inspection_status' => InspectionStatus::Completed->value,
            'scratch_count' => 2,
            'dent_count' => 1,
            'accident_count' => 0,
            'total_damages_detected' => 3,
            'inference_time_ms' => 450,
            'base_depreciated_price' => 20520000,
            'ml_predicted_price' => 18673200,
            'damage_penalty_percent' => 9.0,
            'price_calculation_snapshot' => [
                'standard_price' => 27000000,
                'vehicle_year' => 2022,
                'vehicle_age_years' => 2,
                'age_depreciation_percent' => 16.0,
                'age_depreciation_amount' => 4320000,
                'odometer_km' => 25000,
                'odometer_penalty' => 0,
                'tax_status' => 'active',
                'tax_penalty' => 0,
                'base_depreciated_price' => 22680000,
                'detection_counts' => ['scratch' => 2, 'dent' => 1, 'accident' => 0],
                'visual_penalty_percent' => 9.0,
                'estimated_price' => 20638800,
            ],
        ]);

        $motorcycle = Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelHonda->id,
            'latest_inspection_id' => $inspection->id,
            'title' => 'Honda Vario Detail Test',
            'description' => 'Motor terawat dengan baik',
            'year' => 2022,
            'odometer_km' => 25000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Denpasar, Bali',
            'seller_price' => 21000000,
            'base_depreciated_price' => 22680000,
            'ml_predicted_price' => 20638800,
            'price_label' => PriceLabel::FairPrice->value,
            'condition_grade' => ConditionGrade::LecetRingan->value,
            'scratch_count' => 2,
            'dent_count' => 1,
            'accident_count' => 0,
            'damage_penalty_percent' => 9.0,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);

        $response = $this->getJson("/api/v1/motorcycles/{$motorcycle->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'Honda Vario Detail Test')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'seller_price',
                    'price_breakdown' => [
                        'standard_price',
                        'vehicle_age_years',
                        'age_depreciation_percent',
                        'odometer_penalty',
                        'tax_penalty',
                        'base_depreciated_price',
                        'detection_counts' => ['scratch', 'dent', 'accident'],
                        'confidence_threshold',
                        'model_version',
                        'damage_penalty_percent',
                        'ml_predicted_price',
                        'seller_price',
                        'price_label',
                        'condition_grade',
                    ],
                    'inspection_certificate',
                    'seller',
                ],
            ]);
    }

    public function test_authenticated_user_can_view_my_motorcycles_including_pending(): void
    {
        Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelHonda->id,
            'title' => 'Motor Garasi Saya Pending',
            'year' => 2022,
            'odometer_km' => 10000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Denpasar, Bali',
            'seller_price' => 21000000,
            'base_depreciated_price' => 22000000,
            'ml_predicted_price' => 21500000,
            'price_label' => PriceLabel::FairPrice->value,
            'condition_grade' => ConditionGrade::Mulus->value,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Pending->value,
        ]);

        $token = $this->seller->createToken('seller_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/my-motorcycles');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.moderation_status', 'pending');
    }

    public function test_user_can_create_new_listing_from_inspection(): void
    {
        $inspection = MotorcycleInspection::create([
            'user_id' => $this->seller->id,
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
            'inference_time_ms' => 400,
            'base_depreciated_price' => 22680000,
            'ml_predicted_price' => 22226400,
            'damage_penalty_percent' => 2.0,
            'price_calculation_snapshot' => [
                'motorcycle_model_id' => $this->modelHonda->id,
                'standard_price' => 27000000,
                'vehicle_year' => 2022,
                'vehicle_age_years' => 2,
                'odometer_km' => 10000,
                'tax_status' => 'active',
                'base_depreciated_price' => 22680000,
                'estimated_price' => 22226400,
                'condition_grade' => 'A',
            ],
        ]);

        $token = $this->seller->createToken('seller_token')->plainTextToken;

        $payload = [
            'inspection_id' => $inspection->id,
            'title' => 'Honda Vario 160 Siap Pakai',
            'description' => 'Servis rutin AHASS, ban tebal',
            'seller_price' => 22000000,
            'location_address' => 'Sanur, Denpasar, Bali',
            'latitude' => -8.6705,
            'longitude' => 115.2126,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/motorcycles', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Honda Vario 160 Siap Pakai')
            ->assertJsonPath('data.moderation_status', 'pending');

        $this->assertDatabaseHas('motorcycles', [
            'title' => 'Honda Vario 160 Siap Pakai',
            'user_id' => $this->seller->id,
            'seller_price' => 22000000,
        ]);

        $createdId = $response->json('data.id');
        $this->assertDatabaseHas('motorcycle_price_histories', [
            'motorcycle_id' => $createdId,
            'old_price' => null,
            'new_price' => 22000000,
            'changed_by' => $this->seller->id,
        ]);
    }

    public function test_user_cannot_update_or_delete_other_users_listing(): void
    {
        $motorcycle = Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelHonda->id,
            'title' => 'Motor Milik Seller',
            'year' => 2022,
            'odometer_km' => 10000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Denpasar, Bali',
            'seller_price' => 20000000,
            'base_depreciated_price' => 22000000,
            'ml_predicted_price' => 21000000,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);

        $otherToken = $this->otherUser->createToken('other_token')->plainTextToken;

        // Try to update
        $resUpdate = $this->withHeader('Authorization', "Bearer {$otherToken}")
            ->putJson("/api/v1/motorcycles/{$motorcycle->id}", [
                'title' => 'Diubah Orang Lain',
            ]);

        $resUpdate->assertStatus(403)
            ->assertJsonPath('success', false);

        // Try to delete
        $resDelete = $this->withHeader('Authorization', "Bearer {$otherToken}")
            ->deleteJson("/api/v1/motorcycles/{$motorcycle->id}");

        $resDelete->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_owner_can_update_price_and_records_price_history(): void
    {
        $motorcycle = Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelHonda->id,
            'title' => 'Vario Awal',
            'year' => 2022,
            'odometer_km' => 10000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Denpasar, Bali',
            'seller_price' => 22000000,
            'base_depreciated_price' => 22680000,
            'ml_predicted_price' => 22226400,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);

        $token = $this->seller->createToken('seller_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/motorcycles/{$motorcycle->id}", [
                'seller_price' => 20500000,
                'description' => 'Harga diturunkan BU',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.seller_price', 20500000);

        $this->assertDatabaseHas('motorcycle_price_histories', [
            'motorcycle_id' => $motorcycle->id,
            'old_price' => 22000000,
            'new_price' => 20500000,
            'changed_by' => $this->seller->id,
        ]);
    }

    public function test_owner_can_soft_delete_listing(): void
    {
        $motorcycle = Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->modelHonda->id,
            'title' => 'Motor Mau Dihapus',
            'year' => 2022,
            'odometer_km' => 10000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Denpasar, Bali',
            'seller_price' => 20000000,
            'base_depreciated_price' => 22000000,
            'ml_predicted_price' => 21000000,
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);

        $token = $this->seller->createToken('seller_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/motorcycles/{$motorcycle->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Listing motor berhasil diarsipkan.',
            ]);

        $this->assertSoftDeleted('motorcycles', ['id' => $motorcycle->id]);
    }
}
