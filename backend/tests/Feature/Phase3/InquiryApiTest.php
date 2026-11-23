<?php

namespace Tests\Feature\Phase3;

use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\PriceLabel;
use App\Enums\TaxStatus;
use App\Events\InquiryCreated;
use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Models\MotorcycleModel;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InquiryApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $seller;

    protected User $buyer;

    protected User $stranger;

    protected MotorcycleModel $model;

    protected Motorcycle $motorcycle;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->seller = User::create([
            'name' => 'Seller Bali',
            'email' => 'seller_inquiry@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081234567811',
        ]);
        $this->seller->assignRole('user');

        $this->buyer = User::create([
            'name' => 'Buyer Denpasar',
            'email' => 'buyer_inquiry@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081234567812',
        ]);
        $this->buyer->assignRole('user');

        $this->stranger = User::create([
            'name' => 'Stranger Badung',
            'email' => 'stranger_inquiry@motolens.id',
            'password' => Hash::make('Password123!'),
            'phone_whatsapp' => '081234567813',
        ]);
        $this->stranger->assignRole('user');

        $this->model = MotorcycleModel::create([
            'brand' => 'Honda',
            'model_name' => 'PCX 160 ABS',
            'engine_cc' => 160,
            'category' => 'matic',
            'standard_price' => 36000000,
            'is_active' => true,
        ]);

        $this->motorcycle = Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $this->model->id,
            'title' => 'Honda PCX 160 Siap Touring',
            'year' => 2023,
            'odometer_km' => 8000,
            'tax_status' => TaxStatus::Active->value,
            'location_address' => 'Ubud, Gianyar, Bali',
            'seller_price' => 31000000,
            'base_depreciated_price' => 32000000,
            'ml_predicted_price' => 31500000,
            'price_label' => PriceLabel::FairPrice->value,
            'condition_grade' => 'mulus',
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Approved->value,
        ]);
    }

    public function test_buyer_can_submit_inquiry_for_approved_motorcycle(): void
    {
        Event::fake([InquiryCreated::class]);

        $token = $this->buyer->createToken('buyer_token')->plainTextToken;

        $payload = [
            'motorcycle_id' => $this->motorcycle->id,
            'appointment_date' => now()->addDays(2)->toDateTimeString(),
            'offered_price' => 30000000,
            'notes' => 'Mau cek bodi langsung di Gianyar sore jam 4.',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/inquiries', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Jadwal survei fisik berhasil diajukan kepada penjual.',
            ])
            ->assertJsonPath('data.motorcycle_id', $this->motorcycle->id);

        $this->assertDatabaseHas('inquiries', [
            'motorcycle_id' => $this->motorcycle->id,
            'buyer_id' => $this->buyer->id,
            'status' => 'pending',
        ]);

        Event::assertDispatched(InquiryCreated::class);
    }

    public function test_owner_cannot_submit_inquiry_on_own_motorcycle(): void
    {
        $token = $this->seller->createToken('seller_token')->plainTextToken;

        $payload = [
            'motorcycle_id' => $this->motorcycle->id,
            'appointment_date' => now()->addDays(1)->toDateTimeString(),
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/inquiries', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Anda tidak dapat mengajukan survei pada motor milik Anda sendiri.');
    }

    public function test_buyer_cannot_submit_duplicate_active_inquiry(): void
    {
        Inquiry::create([
            'motorcycle_id' => $this->motorcycle->id,
            'buyer_id' => $this->buyer->id,
            'appointment_date' => now()->addDays(2),
            'status' => InquiryStatus::Pending->value,
        ]);

        $token = $this->buyer->createToken('buyer_token')->plainTextToken;

        $payload = [
            'motorcycle_id' => $this->motorcycle->id,
            'appointment_date' => now()->addDays(3)->toDateTimeString(),
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/inquiries', $payload);

        $response->assertStatus(409)
            ->assertJsonPath('success', false);
    }

    public function test_seller_can_accept_and_complete_inquiry(): void
    {
        $inquiry = Inquiry::create([
            'motorcycle_id' => $this->motorcycle->id,
            'buyer_id' => $this->buyer->id,
            'appointment_date' => now()->addDays(2),
            'status' => InquiryStatus::Pending->value,
        ]);

        $token = $this->seller->createToken('seller_token')->plainTextToken;

        // Seller accepts
        $resAccept = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/inquiries/{$inquiry->id}/status", [
                'status' => 'accepted',
            ]);

        $resAccept->assertStatus(200)
            ->assertJsonPath('data.status', 'accepted');

        $this->assertSame(ListingStatus::Booked, $this->motorcycle->fresh()->status);

        // Seller completes
        $resComplete = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/inquiries/{$inquiry->id}/status", [
                'status' => 'completed',
            ]);

        $resComplete->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        $this->assertSame(ListingStatus::Sold, $this->motorcycle->fresh()->status);
    }

    public function test_stranger_cannot_update_inquiry_status(): void
    {
        $inquiry = Inquiry::create([
            'motorcycle_id' => $this->motorcycle->id,
            'buyer_id' => $this->buyer->id,
            'appointment_date' => now()->addDays(2),
            'status' => InquiryStatus::Pending->value,
        ]);

        $token = $this->stranger->createToken('stranger_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/inquiries/{$inquiry->id}/status", [
                'status' => 'accepted',
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_buyer_can_cancel_inquiry(): void
    {
        $inquiry = Inquiry::create([
            'motorcycle_id' => $this->motorcycle->id,
            'buyer_id' => $this->buyer->id,
            'appointment_date' => now()->addDays(2),
            'status' => InquiryStatus::Pending->value,
        ]);

        $token = $this->buyer->createToken('buyer_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/inquiries/{$inquiry->id}/cancel");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Jadwal survei fisik berhasil dibatalkan.',
            ]);

        $this->assertSame(InquiryStatus::Cancelled, $inquiry->fresh()->status);
    }

    public function test_user_can_list_inquiries_with_role_filter(): void
    {
        Inquiry::create([
            'motorcycle_id' => $this->motorcycle->id,
            'buyer_id' => $this->buyer->id,
            'appointment_date' => now()->addDays(1),
            'status' => InquiryStatus::Pending->value,
        ]);

        $buyerToken = $this->buyer->createToken('buyer_token')->plainTextToken;

        $resBuyer = $this->withHeader('Authorization', "Bearer {$buyerToken}")
            ->getJson('/api/v1/inquiries?role=buyer');

        $resBuyer->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}
