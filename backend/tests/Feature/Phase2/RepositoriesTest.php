<?php

namespace Tests\Feature\Phase2;

use App\Enums\ConditionGrade;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\PriceLabel;
use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Models\MotorcycleModel;
use App\Models\User;
use App\Repositories\InquiryRepository;
use App\Repositories\MotorcycleRepository;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RepositoriesTest extends TestCase
{
    use RefreshDatabase;

    protected MotorcycleRepository $motorcycleRepo;
    protected InquiryRepository $inquiryRepo;
    protected User $user1;
    protected User $user2;
    protected MotorcycleModel $hondaModel;
    protected MotorcycleModel $yamahaModel;

    protected function setUp(): void
    {
        parent::setUp();

        $this->motorcycleRepo = app(MotorcycleRepository::class);
        $this->inquiryRepo = app(InquiryRepository::class);

        $this->user1 = User::factory()->create();
        $this->user2 = User::factory()->create();

        $this->hondaModel = MotorcycleModel::create([
            'brand' => 'Honda',
            'model_name' => 'PCX 160 ABS',
            'category' => 'matic',
            'engine_cc' => 160,
            'standard_price' => 35000000,
            'is_active' => true,
        ]);

        $this->yamahaModel = MotorcycleModel::create([
            'brand' => 'Yamaha',
            'model_name' => 'Aerox 155 VVA',
            'category' => 'matic',
            'engine_cc' => 155,
            'standard_price' => 28000000,
            'is_active' => true,
        ]);
    }

    public function test_motorcycle_repository_filters_public_catalog_by_brand_price_grade_and_label(): void
    {
        // Motor 1: Honda, 30jt, GoodDeal, Mulus, Approved
        Motorcycle::create([
            'user_id' => $this->user1->id,
            'motorcycle_model_id' => $this->hondaModel->id,
            'title' => 'Honda PCX 160 Istimewa',
            'year' => 2023,
            'odometer_km' => 5000,
            'tax_status' => 'active',
            'seller_price' => 30000000,
            'base_depreciated_price' => 33000000,
            'ml_predicted_price' => 32000000,
            'price_label' => PriceLabel::GoodDeal,
            'condition_grade' => ConditionGrade::Mulus,
            'location_address' => 'Denpasar Barat, Bali',
            'status' => ListingStatus::Available,
            'moderation_status' => ModerationStatus::Approved,
        ]);

        // Motor 2: Yamaha, 25jt, FairPrice, Lecet Ringan, Approved
        Motorcycle::create([
            'user_id' => $this->user2->id,
            'motorcycle_model_id' => $this->yamahaModel->id,
            'title' => 'Yamaha Aerox 155 Siap Gas',
            'year' => 2022,
            'odometer_km' => 15000,
            'tax_status' => 'active',
            'seller_price' => 25000000,
            'base_depreciated_price' => 26000000,
            'ml_predicted_price' => 25000000,
            'price_label' => PriceLabel::FairPrice,
            'condition_grade' => ConditionGrade::LecetRingan,
            'location_address' => 'Kuta, Badung, Bali',
            'status' => ListingStatus::Available,
            'moderation_status' => ModerationStatus::Approved,
        ]);

        // Motor 3: Pending moderation (TIDAK boleh masuk katalog)
        Motorcycle::create([
            'user_id' => $this->user1->id,
            'motorcycle_model_id' => $this->hondaModel->id,
            'title' => 'Honda PCX Pending',
            'year' => 2023,
            'odometer_km' => 2000,
            'tax_status' => 'active',
            'seller_price' => 31000000,
            'base_depreciated_price' => 33000000,
            'ml_predicted_price' => 32000000,
            'price_label' => PriceLabel::GoodDeal,
            'condition_grade' => ConditionGrade::Mulus,
            'location_address' => 'Denpasar, Bali',
            'status' => ListingStatus::Available,
            'moderation_status' => ModerationStatus::Pending,
        ]);

        // 1. Katalog publik default hanya approved (2 item)
        $allApproved = $this->motorcycleRepo->getPublicCatalog();
        $this->assertCount(2, $allApproved->items());

        // 2. Filter brand 'Honda'
        $hondaCatalog = $this->motorcycleRepo->getPublicCatalog(['brand' => 'Honda']);
        $this->assertCount(1, $hondaCatalog->items());
        $this->assertSame('Honda PCX 160 Istimewa', $hondaCatalog->items()[0]->title);

        // 3. Filter price range
        $priceCatalog = $this->motorcycleRepo->getPublicCatalog(['min_price' => 28000000]);
        $this->assertCount(1, $priceCatalog->items());
        $this->assertSame(30000000, $priceCatalog->items()[0]->seller_price);

        // 4. Filter price label
        $goodDealCatalog = $this->motorcycleRepo->getPublicCatalog(['price_label' => PriceLabel::GoodDeal]);
        $this->assertCount(1, $goodDealCatalog->items());
    }

    public function test_compare_fetches_up_to_three_motorcycles(): void
    {
        $m1 = Motorcycle::create([
            'user_id' => $this->user1->id,
            'motorcycle_model_id' => $this->hondaModel->id,
            'title' => 'Motor A',
            'year' => 2022,
            'odometer_km' => 10000,
            'tax_status' => 'active',
            'seller_price' => 30000000,
            'location_address' => 'Denpasar, Bali',
            'status' => ListingStatus::Available,
            'moderation_status' => ModerationStatus::Approved,
        ]);

        $m2 = Motorcycle::create([
            'user_id' => $this->user2->id,
            'motorcycle_model_id' => $this->yamahaModel->id,
            'title' => 'Motor B',
            'year' => 2021,
            'odometer_km' => 15000,
            'tax_status' => 'active',
            'seller_price' => 24000000,
            'location_address' => 'Denpasar, Bali',
            'status' => ListingStatus::Available,
            'moderation_status' => ModerationStatus::Approved,
        ]);

        $compared = $this->motorcycleRepo->compare([$m1->id, $m2->id]);
        $this->assertCount(2, $compared);
    }

    public function test_inquiry_repository_queries_by_buyer_and_seller(): void
    {
        $motor = Motorcycle::create([
            'user_id' => $this->user1->id,
            'motorcycle_model_id' => $this->hondaModel->id,
            'title' => 'Motor Survei',
            'year' => 2022,
            'odometer_km' => 10000,
            'tax_status' => 'active',
            'seller_price' => 30000000,
            'location_address' => 'Denpasar, Bali',
            'status' => ListingStatus::Available,
            'moderation_status' => ModerationStatus::Approved,
        ]);

        $inquiry = Inquiry::create([
            'motorcycle_id' => $motor->id,
            'buyer_id' => $this->user2->id,
            'appointment_date' => Carbon::tomorrow()->setHour(10),
            'offered_price' => 29000000,
            'status' => 'pending',
        ]);

        $byBuyer = $this->inquiryRepo->getByBuyer($this->user2->id);
        $this->assertCount(1, $byBuyer->items());
        $this->assertSame($inquiry->id, $byBuyer->items()[0]->id);

        $bySeller = $this->inquiryRepo->getBySeller($this->user1->id);
        $this->assertCount(1, $bySeller->items());
        $this->assertSame($inquiry->id, $bySeller->items()[0]->id);
    }
}
