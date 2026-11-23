<?php

namespace Tests\Feature\Phase2;

use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Http\Requests\InspectMotorcycleRequest;
use App\Http\Requests\StoreInquiryRequest;
use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Models\MotorcycleModel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PoliciesAndRequestsTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;

    protected User $stranger;

    protected User $admin;

    protected Motorcycle $motorcycle;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'user']);

        $this->owner = User::factory()->create();
        $this->owner->assignRole('user');

        $this->stranger = User::factory()->create();
        $this->stranger->assignRole('user');

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $model = MotorcycleModel::create([
            'brand' => 'Honda',
            'model_name' => 'Beat Deluxe',
            'category' => 'matic',
            'engine_cc' => 110,
            'standard_price' => 18500000,
            'is_active' => true,
        ]);

        $this->motorcycle = Motorcycle::create([
            'user_id' => $this->owner->id,
            'motorcycle_model_id' => $model->id,
            'title' => 'Honda Beat Deluxe 2023',
            'year' => 2023,
            'odometer_km' => 5000,
            'tax_status' => 'active',
            'seller_price' => 17000000,
            'location_address' => 'Denpasar Utara, Bali',
            'status' => ListingStatus::Available,
            'moderation_status' => ModerationStatus::Pending,
        ]);
    }

    public function test_inspect_request_validation_rules(): void
    {
        $request = new InspectMotorcycleRequest;
        $rules = $request->rules();

        // 1. Data kosong harus gagal validasi
        $validator = Validator::make([], $rules);
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('photo', $validator->errors()->toArray());
        $this->assertArrayHasKey('motorcycle_model_id', $validator->errors()->toArray());
        $this->assertArrayHasKey('year', $validator->errors()->toArray());
        $this->assertArrayHasKey('odometer_km', $validator->errors()->toArray());
        $this->assertArrayHasKey('tax_status', $validator->errors()->toArray());

        // 2. Nilai pajak tidak valid
        $invalidTax = Validator::make([
            'tax_status' => 'invalid_status',
        ], ['tax_status' => $rules['tax_status']]);
        $this->assertTrue($invalidTax->fails());
    }

    public function test_store_inquiry_request_requires_future_date(): void
    {
        $request = new StoreInquiryRequest;
        $rules = $request->rules();

        // Tanggal masa lalu harus gagal
        $pastValidator = Validator::make([
            'motorcycle_id' => $this->motorcycle->id,
            'appointment_date' => Carbon::yesterday()->toIso8601String(),
        ], $rules);

        $this->assertTrue($pastValidator->fails());
        $this->assertArrayHasKey('appointment_date', $pastValidator->errors()->toArray());
    }

    public function test_motorcycle_policy_authorization(): void
    {
        // 1. Publik tidak boleh melihat motor yang masih pending
        $this->assertFalse(Gate::forUser(null)->allows('view', $this->motorcycle));

        // 2. Pemilik boleh melihat motor pending miliknya
        $this->assertTrue(Gate::forUser($this->owner)->allows('view', $this->motorcycle));

        // 3. Admin boleh melihat motor pending
        $this->assertTrue(Gate::forUser($this->admin)->allows('view', $this->motorcycle));

        // 4. Stranger tidak boleh melihat motor pending
        $this->assertFalse(Gate::forUser($this->stranger)->allows('view', $this->motorcycle));

        // 5. Update/Delete: Pemilik & Admin boleh, Stranger dilarang
        $this->assertTrue(Gate::forUser($this->owner)->allows('update', $this->motorcycle));
        $this->assertTrue(Gate::forUser($this->admin)->allows('update', $this->motorcycle));
        $this->assertFalse(Gate::forUser($this->stranger)->allows('update', $this->motorcycle));

        $this->assertTrue(Gate::forUser($this->owner)->allows('delete', $this->motorcycle));
        $this->assertFalse(Gate::forUser($this->stranger)->allows('delete', $this->motorcycle));

        // 6. Moderasi: Hanya admin
        $this->assertTrue(Gate::forUser($this->admin)->allows('moderate', $this->motorcycle));
        $this->assertFalse(Gate::forUser($this->owner)->allows('moderate', $this->motorcycle));
    }

    public function test_inquiry_policy_authorization(): void
    {
        $inquiry = Inquiry::create([
            'motorcycle_id' => $this->motorcycle->id,
            'buyer_id' => $this->stranger->id,
            'appointment_date' => Carbon::tomorrow()->setHour(11),
            'status' => 'pending',
        ]);

        // Pembeli boleh melihat & mengupdate booking
        $this->assertTrue(Gate::forUser($this->stranger)->allows('view', $inquiry));
        $this->assertTrue(Gate::forUser($this->stranger)->allows('update', $inquiry));

        // Penjual (pemilik motor) boleh melihat & merespon
        $this->assertTrue(Gate::forUser($this->owner)->allows('view', $inquiry));
        $this->assertTrue(Gate::forUser($this->owner)->allows('update', $inquiry));

        // Pengguna lain yang tidak terkait tidak berhak
        $thirdUser = User::factory()->create();
        $this->assertFalse(Gate::forUser($thirdUser)->allows('view', $inquiry));
        $this->assertFalse(Gate::forUser($thirdUser)->allows('update', $inquiry));

        // Admin berhak penuh
        $this->assertTrue(Gate::forUser($this->admin)->allows('view', $inquiry));
        $this->assertTrue(Gate::forUser($this->admin)->allows('delete', $inquiry));
    }
}
