<?php

namespace Tests\Feature\Phase2;

use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Models\MotorcycleModel;
use App\Models\User;
use App\Services\InquiryService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class InquiryServiceTest extends TestCase
{
    use RefreshDatabase;

    protected InquiryService $inquiryService;
    protected User $seller;
    protected User $buyer;
    protected Motorcycle $motorcycle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->inquiryService = app(InquiryService::class);

        $this->seller = User::factory()->create();
        $this->buyer = User::factory()->create();

        $model = MotorcycleModel::create([
            'brand' => 'Honda',
            'model_name' => 'Scoopy Prestige',
            'category' => 'matic',
            'engine_cc' => 110,
            'standard_price' => 22000000,
            'is_active' => true,
        ]);

        $this->motorcycle = Motorcycle::create([
            'user_id' => $this->seller->id,
            'motorcycle_model_id' => $model->id,
            'title' => 'Honda Scoopy Prestige 2023 Putih Mulus',
            'year' => 2023,
            'odometer_km' => 8000,
            'tax_status' => 'active',
            'seller_price' => 19500000,
            'base_depreciated_price' => 20000000,
            'ml_predicted_price' => 19500000,
            'location_address' => 'Denpasar Barat, Bali',
            'status' => ListingStatus::Available,
            'moderation_status' => ModerationStatus::Approved,
        ]);
    }

    public function test_buyer_can_create_survey_inquiry(): void
    {
        $appointment = Carbon::tomorrow()->setHour(14)->setMinute(0);

        $inquiry = $this->inquiryService->createInquiry(
            buyerId: $this->buyer->id,
            motorcycleId: $this->motorcycle->id,
            appointmentDate: $appointment,
            offeredPrice: 19000000,
            notes: 'Mau cek langsung kondisi bodi dan test ride ringan.'
        );

        $this->assertInstanceOf(Inquiry::class, $inquiry);
        $this->assertSame(InquiryStatus::Pending, $inquiry->status);
        $this->assertSame($this->buyer->id, $inquiry->buyer_id);
        $this->assertSame($this->motorcycle->id, $inquiry->motorcycle_id);
        $this->assertSame(19000000, $inquiry->offered_price);
    }

    public function test_seller_cannot_book_own_motorcycle(): void
    {
        $this->expectException(ValidationException::class);

        $this->inquiryService->createInquiry(
            buyerId: $this->seller->id,
            motorcycleId: $this->motorcycle->id,
            appointmentDate: Carbon::tomorrow()->setHour(10)
        );
    }

    public function test_cannot_book_unapproved_or_unavailable_motorcycle(): void
    {
        $this->motorcycle->update(['moderation_status' => ModerationStatus::Pending]);

        $this->expectException(ValidationException::class);

        $this->inquiryService->createInquiry(
            buyerId: $this->buyer->id,
            motorcycleId: $this->motorcycle->id,
            appointmentDate: Carbon::tomorrow()->setHour(10)
        );
    }

    public function test_prevents_survey_schedule_collision(): void
    {
        $time = Carbon::tomorrow()->setHour(15)->setMinute(0);

        // Booking pertama
        $this->inquiryService->createInquiry(
            buyerId: $this->buyer->id,
            motorcycleId: $this->motorcycle->id,
            appointmentDate: $time
        );

        $otherBuyer = User::factory()->create();

        // Booking kedua pada selisih hanya 30 menit (dalam window 1 jam)
        $this->expectException(ValidationException::class);

        $this->inquiryService->createInquiry(
            buyerId: $otherBuyer->id,
            motorcycleId: $this->motorcycle->id,
            appointmentDate: $time->copy()->addMinutes(30)
        );
    }

    public function test_accepting_inquiry_marks_motorcycle_as_booked(): void
    {
        $inquiry = $this->inquiryService->createInquiry(
            buyerId: $this->buyer->id,
            motorcycleId: $this->motorcycle->id,
            appointmentDate: Carbon::tomorrow()->setHour(14)
        );

        $this->inquiryService->respondInquiry(
            inquiry: $inquiry,
            status: InquiryStatus::Accepted,
            responderId: $this->seller->id
        );

        $this->motorcycle->refresh();
        $this->assertSame(ListingStatus::Booked, $this->motorcycle->status);
    }

    public function test_cancelling_accepted_inquiry_reverts_motorcycle_to_available(): void
    {
        $inquiry = $this->inquiryService->createInquiry(
            buyerId: $this->buyer->id,
            motorcycleId: $this->motorcycle->id,
            appointmentDate: Carbon::tomorrow()->setHour(14)
        );

        $this->inquiryService->respondInquiry($inquiry, InquiryStatus::Accepted, $this->seller->id);
        $this->motorcycle->refresh();
        $this->assertSame(ListingStatus::Booked, $this->motorcycle->status);

        $this->inquiryService->cancelInquiry($inquiry, $this->buyer->id, 'Ada halangan mendadak');

        $this->motorcycle->refresh();
        $this->assertSame(ListingStatus::Available, $this->motorcycle->status);
    }
}
