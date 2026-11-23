<?php

namespace Tests\Feature\Phase3;

use App\Enums\FeedbackReviewStatus;
use App\Enums\FeedbackType;
use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\PriceLabel;
use App\Enums\SourceType;
use App\Enums\TaxStatus;
use App\Models\Inquiry;
use App\Models\InspectionFeedback;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\MotorcycleModel;
use App\Models\Report;
use App\Models\User;
use App\Notifications\InquiryStatusUpdatedNotification;
use App\Notifications\MotorcycleModerationNotification;
use App\Notifications\NewInquiryNotification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationAndSupportApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $seller;

    protected User $buyer;

    protected MotorcycleModel $model;

    protected Motorcycle $motorcycle;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::create([
            'name' => 'Admin MotoLens',
            'email' => 'admin_support@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081111111111',
        ]);
        $this->admin->assignRole('admin');

        $this->seller = User::create([
            'name' => 'Seller Support',
            'email' => 'seller_support@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '082222222222',
        ]);
        $this->seller->assignRole('user');

        $this->buyer = User::create([
            'name' => 'Buyer Support',
            'email' => 'buyer_support@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '083333333333',
        ]);
        $this->buyer->assignRole('user');

        $this->model = MotorcycleModel::create([
            'brand' => 'Yamaha',
            'model_name' => 'NMAX 155 Connected',
            'engine_cc' => 155,
            'category' => 'matic',
            'standard_price' => 32000000,
            'is_active' => true,
        ]);

        $this->motorcycle = Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->model->id,
            'title' => 'Yamaha NMAX 2022 Istimewa',
            'description' => 'Kondisi sangat mulus terawat service rutin',
            'year' => 2022,
            'odometer_km' => 12000,
            'tax_status' => TaxStatus::Active,
            'seller_price' => 28000000,
            'base_depreciated_price' => 27000000,
            'ml_predicted_price' => 27500000,
            'price_label' => PriceLabel::FairPrice,
            'condition_grade' => 'mulus',
            'status' => ListingStatus::Available,
            'moderation_status' => ModerationStatus::Approved,
            'location_address' => 'Denpasar Barat, Bali',
            'latitude' => -8.6705,
            'longitude' => 115.2126,
        ]);
    }

    public function test_new_inquiry_sends_database_notification_to_seller(): void
    {
        Sanctum::actingAs($this->buyer);

        $response = $this->postJson('/api/v1/inquiries', [
            'motorcycle_id' => $this->motorcycle->id,
            'appointment_date' => now()->addDays(2)->format('Y-m-d H:i:s'),
            'notes' => 'Mau cek fisik siang hari',
        ]);

        $response->assertStatus(201);

        // Seller receives notification in database
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->seller->id,
            'notifiable_type' => User::class,
            'type' => NewInquiryNotification::class,
        ]);
    }

    public function test_inquiry_status_updated_sends_notification_to_buyer(): void
    {
        $inquiry = Inquiry::create([
            'motorcycle_id' => $this->motorcycle->id,
            'buyer_id' => $this->buyer->id,
            'appointment_date' => now()->addDays(2),
            'status' => InquiryStatus::Pending,
        ]);

        Sanctum::actingAs($this->seller);

        $response = $this->patchJson("/api/v1/inquiries/{$inquiry->id}/status", [
            'status' => 'accepted',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->buyer->id,
            'notifiable_type' => User::class,
            'type' => InquiryStatusUpdatedNotification::class,
        ]);
    }

    public function test_listing_moderation_sends_notification_to_seller(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/v1/admin/motorcycles/{$this->motorcycle->id}/moderation", [
            'moderation_status' => 'rejected',
            'rejection_reason' => 'Foto STNK buram, mohon upload ulang.',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->seller->id,
            'notifiable_type' => User::class,
            'type' => MotorcycleModerationNotification::class,
        ]);
    }

    public function test_user_can_list_and_read_notifications(): void
    {
        // Kirim 2 notifikasi dummy ke buyer
        $inquiry = Inquiry::create([
            'motorcycle_id' => $this->motorcycle->id,
            'buyer_id' => $this->buyer->id,
            'appointment_date' => now()->addDays(2),
            'status' => InquiryStatus::Pending,
        ]);

        $this->buyer->notify(new InquiryStatusUpdatedNotification($inquiry, 'seller'));
        $this->buyer->notify(new InquiryStatusUpdatedNotification($inquiry, 'seller'));

        Sanctum::actingAs($this->buyer);

        $response = $this->getJson('/api/v1/notifications');
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.unread_count', 2);

        $notifId = $response->json('data.0.id');

        // Mark single notification as read
        $readResponse = $this->patchJson("/api/v1/notifications/{$notifId}/read");
        $readResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        // Mark all as read
        $readAllResponse = $this->postJson('/api/v1/notifications/read-all');
        $readAllResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify unread count is now 0
        $finalCheck = $this->getJson('/api/v1/notifications');
        $finalCheck->assertJsonPath('meta.unread_count', 0);
    }

    public function test_user_can_toggle_favorite_motorcycle(): void
    {
        Sanctum::actingAs($this->buyer);

        // Toggle ON
        $toggleOn = $this->postJson("/api/v1/motorcycles/{$this->motorcycle->id}/favorite");
        $toggleOn->assertStatus(200)
            ->assertJsonPath('data.is_favorited', true);

        $this->assertDatabaseHas('motorcycle_favorites', [
            'user_id' => $this->buyer->id,
            'motorcycle_id' => $this->motorcycle->id,
        ]);

        // Cek daftar favorit
        $favList = $this->getJson('/api/v1/favorites');
        $favList->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');

        // Cek detail listing menyertakan is_favorited = true
        $detail = $this->getJson("/api/v1/motorcycles/{$this->motorcycle->id}");
        $detail->assertStatus(200)
            ->assertJsonPath('data.is_favorited', true)
            ->assertJsonStructure(['data' => ['price_histories']]);

        // Toggle OFF
        $toggleOff = $this->postJson("/api/v1/motorcycles/{$this->motorcycle->id}/favorite");
        $toggleOff->assertStatus(200)
            ->assertJsonPath('data.is_favorited', false);

        $this->assertDatabaseMissing('motorcycle_favorites', [
            'user_id' => $this->buyer->id,
            'motorcycle_id' => $this->motorcycle->id,
        ]);
    }

    public function test_user_can_report_motorcycle_listing_and_cannot_report_own(): void
    {
        // 1. Seller cannot report own motorcycle
        Sanctum::actingAs($this->seller);
        $selfReport = $this->postJson("/api/v1/motorcycles/{$this->motorcycle->id}/reports", [
            'reason' => 'spam',
            'description' => 'Ini motor saya sendiri',
        ]);
        $selfReport->assertStatus(422);

        // 2. Buyer can report motorcycle
        Sanctum::actingAs($this->buyer);
        $reportResponse = $this->postJson("/api/v1/motorcycles/{$this->motorcycle->id}/reports", [
            'reason' => 'fake_odometer',
            'description' => 'Odometer tampaknya diputar mundur',
        ]);
        $reportResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reason', 'fake_odometer');

        $reportId = $reportResponse->json('data.id');

        // 3. Admin can view reports
        Sanctum::actingAs($this->admin);
        $adminReports = $this->getJson('/api/v1/admin/reports');
        $adminReports->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');

        // 4. Admin updates report status
        $updateReport = $this->patchJson("/api/v1/admin/reports/{$reportId}", [
            'status' => 'reviewing',
        ]);
        $updateReport->assertStatus(200)
            ->assertJsonPath('data.status', 'reviewing');
    }

    public function test_admin_can_list_and_review_inspection_feedback(): void
    {
        $inspection = MotorcycleInspection::create([
            'motorcycle_id' => $this->motorcycle->id,
            'user_id' => $this->seller->id,
            'model_name' => 'yolov8n-motolens-v1.0.0',
            'model_version' => 'v1.0.0',
            'model_sha256' => hash('sha256', 'test'),
            'confidence_threshold' => 0.35,
            'nms_iou_threshold' => 0.45,
            'scratch_count' => 1,
            'dent_count' => 0,
            'accident_count' => 0,
            'total_damages_detected' => 1,
            'average_confidence' => 0.88,
            'inference_time_ms' => 45,
            'base_depreciated_price' => 27000000,
            'ml_predicted_price' => 26500000,
            'damage_penalty_percent' => 2.5,
            'verification_status' => 'verified',
            'source_type' => SourceType::AndroidCamera,
            'inspection_status' => 'completed',
        ]);

        $feedback = InspectionFeedback::create([
            'inspection_id' => $inspection->id,
            'submitted_by' => $this->seller->id,
            'feedback_type' => FeedbackType::FalsePositive,
            'comment' => 'Baret halus di knalpot adalah pantulan cahaya matahari.',
            'review_status' => FeedbackReviewStatus::Pending,
        ]);

        Sanctum::actingAs($this->admin);

        // List feedbacks
        $listResponse = $this->getJson('/api/v1/admin/inspection-feedbacks');
        $listResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');

        // Update feedback review status
        $updateResponse = $this->patchJson("/api/v1/admin/inspection-feedbacks/{$feedback->id}", [
            'review_status' => 'accepted',
        ]);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.review_status', 'accepted')
            ->assertJsonPath('data.reviewed_by', $this->admin->id);
    }
}
