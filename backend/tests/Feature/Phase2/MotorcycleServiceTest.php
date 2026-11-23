<?php

namespace Tests\Feature\Phase2;

use App\Enums\ConditionGrade;
use App\Enums\InspectionStatus;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\PriceLabel;
use App\Enums\SourceType;
use App\Enums\VerificationStatus;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\MotorcycleModel;
use App\Models\MotorcyclePriceHistory;
use App\Models\User;
use App\Services\MotorcycleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class MotorcycleServiceTest extends TestCase
{
    use RefreshDatabase;

    protected MotorcycleService $motorcycleService;

    protected User $owner;

    protected User $otherUser;

    protected User $admin;

    protected MotorcycleModel $motorcycleModel;

    protected MotorcycleInspection $inspection;

    protected function setUp(): void
    {
        parent::setUp();

        $this->motorcycleService = app(MotorcycleService::class);

        $this->owner = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->admin = User::factory()->create();

        $this->motorcycleModel = MotorcycleModel::create([
            'brand' => 'Yamaha',
            'model_name' => 'NMAX 155 Connected',
            'category' => 'matic',
            'engine_cc' => 155,
            'standard_price' => 31000000,
            'is_active' => true,
        ]);

        $this->inspection = MotorcycleInspection::create([
            'user_id' => $this->owner->id,
            'model_name' => 'model_damage',
            'model_version' => 'optimized_v2',
            'confidence_threshold' => 0.35,
            'nms_iou_threshold' => 0.45,
            'source_type' => SourceType::WebUpload,
            'inspection_status' => InspectionStatus::Completed,
            'verification_status' => VerificationStatus::Unverified,
            'accident_count' => 0,
            'dent_count' => 1,
            'scratch_count' => 2,
            'total_damages_detected' => 3,
            'average_confidence' => 0.82,
            'base_depreciated_price' => 25000000,
            'ml_predicted_price' => 22500000,
            'damage_penalty_percent' => 10.0,
            'price_calculation_snapshot' => [
                'vehicle' => [
                    'model_id' => $this->motorcycleModel->id,
                    'year' => 2022,
                    'odometer_km' => 12000,
                    'tax_status' => 'active',
                ],
                'condition_grade' => 'lecet_ringan',
                'breakdown' => [
                    'base_price' => 25000000,
                    'ml_predicted_price' => 22500000,
                    'visual_penalty_percent' => 10.0,
                ],
            ],
        ]);
    }

    public function test_publish_from_inspection_creates_listing_and_links_bidirectionally(): void
    {
        $listingData = [
            'title' => 'Yamaha NMAX 2022 Terawat Siap Pakai',
            'description' => 'Motor jarang dipakai, servis rutin berkala di bengkel resmi.',
            'seller_price' => 22500000,
            'location_address' => 'Denpasar Selatan, Bali',
        ];

        $motorcycle = $this->motorcycleService->publishFromInspection(
            inspectionId: $this->inspection->id,
            userId: $this->owner->id,
            data: $listingData
        );

        $this->assertInstanceOf(Motorcycle::class, $motorcycle);
        $this->assertSame($this->owner->id, $motorcycle->user_id);
        $this->assertSame($this->motorcycleModel->id, $motorcycle->motorcycle_model_id);
        $this->assertSame(22500000, $motorcycle->seller_price);
        $this->assertSame(PriceLabel::FairPrice, $motorcycle->price_label);
        $this->assertSame(ConditionGrade::LecetRingan, $motorcycle->condition_grade);
        $this->assertSame(ListingStatus::Available, $motorcycle->status);
        $this->assertSame(ModerationStatus::Pending, $motorcycle->moderation_status);

        // Verifikasi relasi dua arah
        $this->assertSame($this->inspection->id, $motorcycle->latest_inspection_id);
        $this->inspection->refresh();
        $this->assertSame($motorcycle->id, $this->inspection->motorcycle_id);

        // Verifikasi riwayat harga tercatat
        $history = MotorcyclePriceHistory::where('motorcycle_id', $motorcycle->id)->first();
        $this->assertNotNull($history);
        $this->assertNull($history->old_price);
        $this->assertSame(22500000, $history->new_price);
        $this->assertSame($this->owner->id, $history->changed_by);
    }

    public function test_cannot_publish_inspection_owned_by_another_user(): void
    {
        $this->expectException(ValidationException::class);

        $this->motorcycleService->publishFromInspection(
            inspectionId: $this->inspection->id,
            userId: $this->otherUser->id,
            data: ['seller_price' => 22000000]
        );
    }

    public function test_cannot_publish_from_failed_inspection(): void
    {
        $this->inspection->update(['inspection_status' => InspectionStatus::Failed]);

        $this->expectException(ValidationException::class);

        $this->motorcycleService->publishFromInspection(
            inspectionId: $this->inspection->id,
            userId: $this->owner->id,
            data: ['seller_price' => 22000000]
        );
    }

    public function test_cannot_publish_duplicate_listing_from_same_inspection(): void
    {
        $this->motorcycleService->publishFromInspection(
            inspectionId: $this->inspection->id,
            userId: $this->owner->id,
            data: ['seller_price' => 22500000]
        );

        $this->expectException(ValidationException::class);

        $this->motorcycleService->publishFromInspection(
            inspectionId: $this->inspection->id,
            userId: $this->owner->id,
            data: ['seller_price' => 22500000]
        );
    }

    public function test_update_seller_price_records_history_and_recomputes_label(): void
    {
        $motorcycle = $this->motorcycleService->publishFromInspection(
            inspectionId: $this->inspection->id,
            userId: $this->owner->id,
            data: ['seller_price' => 22500000]
        );

        // Turunkan harga ke 20.000.000 (< 95% dari 22.500.000 -> GoodDeal)
        $updated = $this->motorcycleService->updateSellerPrice($motorcycle, 20000000, $this->owner->id);

        $this->assertSame(20000000, $updated->seller_price);
        $this->assertSame(PriceLabel::GoodDeal, $updated->price_label);

        $histories = MotorcyclePriceHistory::where('motorcycle_id', $motorcycle->id)
            ->orderBy('id', 'desc')
            ->get();

        $this->assertCount(2, $histories);
        $this->assertSame(22500000, $histories[0]->old_price);
        $this->assertSame(20000000, $histories[0]->new_price);
    }

    public function test_admin_can_moderate_listing(): void
    {
        $motorcycle = $this->motorcycleService->publishFromInspection(
            inspectionId: $this->inspection->id,
            userId: $this->owner->id,
            data: ['seller_price' => 22500000]
        );

        $approved = $this->motorcycleService->moderateListing(
            motorcycle: $motorcycle,
            status: ModerationStatus::Approved,
            adminId: $this->admin->id
        );

        $this->assertSame(ModerationStatus::Approved, $approved->moderation_status);

        $rejected = $this->motorcycleService->moderateListing(
            motorcycle: $motorcycle,
            status: ModerationStatus::Rejected,
            rejectionReason: 'Deskripsi tidak sesuai foto.',
            adminId: $this->admin->id
        );

        $this->assertSame(ModerationStatus::Rejected, $rejected->moderation_status);
    }
}
