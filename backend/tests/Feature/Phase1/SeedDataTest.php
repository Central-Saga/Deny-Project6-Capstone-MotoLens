<?php

namespace Tests\Feature\Phase1;

use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\SourceType;
use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\MotorcycleModel;
use App\Models\MotorcyclePriceHistory;
use App\Models\User;
use App\Services\PriceEstimationService;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\Support\BaliLocations;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Verifikasi DoD Fase 1: >=50 listing seed, konsistensi rumus Bab 4.3-4.7, penanda seed_demo,
 * akun demo, dan idempotensi seeder.
 */
class SeedDataTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public'); // foto placeholder tidak ditulis ke storage asli
        $this->seed(DatabaseSeeder::class);
    }

    public function test_at_least_55_listings_with_50_approved_and_5_pending(): void
    {
        $this->assertGreaterThanOrEqual(55, Motorcycle::count());
        $this->assertGreaterThanOrEqual(50, Motorcycle::approved()->count());
        $this->assertSame(5, Motorcycle::pending()->count());
        $this->assertGreaterThanOrEqual(50, Motorcycle::publiclyVisible()->count());
        $this->assertSame(
            Motorcycle::count(),
            Motorcycle::approved()->count() + Motorcycle::pending()->count() + Motorcycle::moderation(ModerationStatus::Rejected)->count()
        );
    }

    public function test_listings_are_in_bali_regencies(): void
    {
        $regencies = collect(BaliLocations::all())->pluck('regency')->unique()->all();
        $this->assertEqualsCanonicalizing(['Denpasar', 'Badung', 'Gianyar', 'Tabanan', 'Buleleng'], $regencies);

        foreach (Motorcycle::all() as $m) {
            $this->assertStringEndsWith(', Bali', $m->location_address);
            $this->assertTrue(
                collect($regencies)->contains(fn ($r) => str_contains($m->location_address, $r)),
                "Lokasi di luar wilayah target: {$m->location_address}"
            );
        }

        $usedRegencies = Motorcycle::all()->map(fn ($m) => explode(', ', $m->location_address)[1])->unique();
        $this->assertCount(5, $usedRegencies, 'Seluruh 5 kabupaten/kota harus terwakili.');
    }

    public function test_every_listing_has_a_seed_demo_inspection_and_no_real_inference_is_seeded(): void
    {
        $this->assertSame(0, MotorcycleInspection::realInference()->count());

        foreach (Motorcycle::with('latestInspection')->get() as $m) {
            $this->assertNotNull($m->latestInspection, "Listing {$m->id} tanpa latest_inspection");
            $this->assertSame(SourceType::SeedDemo, $m->latestInspection->source_type);
            $this->assertSame($m->id, $m->latestInspection->motorcycle_id);
            $this->assertSame('completed', $m->latestInspection->inspection_status->value);
            // data demo tidak boleh mengklaim identitas model/inferensi nyata
            $this->assertSame('seed_demo', $m->latestInspection->model_name);
            $this->assertNull($m->latestInspection->model_sha256);
            $this->assertNull($m->latestInspection->inference_time_ms);
            $this->assertFalse($m->latestInspection->price_calculation_snapshot['is_real_inference']);
            // verifikasi tidak diklaim
            $this->assertFalse($m->is_camera_verified);
            $this->assertSame('unverified', $m->verification_status->value);
            $this->assertSame('unverified', $m->latestInspection->verification_status->value);
        }
    }

    public function test_calculated_values_are_consistent_with_price_formula(): void
    {
        $svc = app(PriceEstimationService::class);

        foreach (Motorcycle::with(['motorcycleModel', 'latestInspection'])->get() as $m) {
            $r = $svc->calculate(
                standardPrice: $m->motorcycleModel->standard_price,
                vehicleYear: $m->year,
                odometerKm: $m->odometer_km,
                taxStatus: $m->tax_status,
                detectionCounts: ['Scratch' => $m->scratch_count, 'Dent' => $m->dent_count, 'Accident' => $m->accident_count],
                sellerPrice: $m->seller_price,
            );

            $this->assertSame($r['base_depreciated_price'], $m->base_depreciated_price);
            $this->assertSame($r['estimated_price'], $m->ml_predicted_price);
            $this->assertEquals($r['visual_penalty_percent'], (float) $m->damage_penalty_percent);
            $this->assertSame($r['price_label'], $m->price_label?->value);
            $this->assertSame($r['condition_grade'], $m->condition_grade?->value);
            $this->assertSame(0, $m->ml_predicted_price % 10_000, 'P_ml harus kelipatan Rp10.000');

            // inspeksi menyimpan nilai yang sama + snapshot parameter
            $i = $m->latestInspection;
            $this->assertSame($m->base_depreciated_price, $i->base_depreciated_price);
            $this->assertSame($m->ml_predicted_price, $i->ml_predicted_price);
            $this->assertEquals((float) $m->damage_penalty_percent, (float) $i->damage_penalty_percent);
            $this->assertSame($m->ml_predicted_price, $i->price_calculation_snapshot['estimated_price']);
            $this->assertArrayHasKey('parameters', $i->price_calculation_snapshot);
        }
    }

    public function test_detection_counts_are_consistent_between_listing_inspection_and_detections_json(): void
    {
        foreach (Motorcycle::with('latestInspection')->get() as $m) {
            $i = $m->latestInspection;
            $this->assertSame($m->scratch_count, $i->scratch_count);
            $this->assertSame($m->dent_count, $i->dent_count);
            $this->assertSame($m->accident_count, $i->accident_count);
            $this->assertSame($i->scratch_count + $i->dent_count + $i->accident_count, $i->total_damages_detected);

            $byClass = collect($i->detections_json)->countBy('class_name');
            $this->assertSame($i->scratch_count, $byClass->get('Scratch', 0));
            $this->assertSame($i->dent_count, $byClass->get('Dent', 0));
            $this->assertSame($i->accident_count, $byClass->get('Accident', 0));

            foreach ($i->detections_json as $d) {
                $this->assertContains($d['class_name'], ['Accident', 'Dent', 'Scratch']);
                $this->assertSame(['Accident', 'Dent', 'Scratch'][$d['class_index']], $d['class_name']);
                $this->assertGreaterThanOrEqual(0.35, $d['confidence']);
                $this->assertGreaterThanOrEqual(0, $d['bbox']['x1']);
                $this->assertGreaterThanOrEqual(0, $d['bbox']['y1']);
                $this->assertLessThanOrEqual($i->image_width, $d['bbox']['x2']);
                $this->assertLessThanOrEqual($i->image_height, $d['bbox']['y2']);
            }
        }
    }

    public function test_seed_has_variety_in_labels_grades_year_and_status(): void
    {
        $this->assertEqualsCanonicalizing(
            ['good_deal', 'fair_price', 'overpriced'],
            Motorcycle::query()->distinct()->pluck('price_label')->map->value->all()
        );
        $this->assertEqualsCanonicalizing(
            ['mulus', 'lecet_ringan', 'perlu_perbaikan'],
            Motorcycle::query()->distinct()->pluck('condition_grade')->map->value->all()
        );
        $this->assertGreaterThanOrEqual(5, Motorcycle::distinct()->count('year'));
        $this->assertGreaterThanOrEqual(8, MotorcycleModel::whereHas('motorcycles')->count());
        $this->assertTrue(Motorcycle::where('tax_status', 'expired')->exists());
        $this->assertTrue(Motorcycle::where('tax_status', 'active')->exists());
        $this->assertTrue(Motorcycle::withStatus(ListingStatus::Booked)->exists());
        $this->assertTrue(Motorcycle::withStatus(ListingStatus::Sold)->exists());
        $this->assertGreaterThan(0, Motorcycle::sum('seller_price'));
    }

    public function test_accident_dent_scratch_columns_exist_and_no_crack_columns(): void
    {
        foreach (['motorcycles', 'motorcycle_inspections'] as $table) {
            foreach (['accident_count', 'dent_count', 'scratch_count'] as $col) {
                $this->assertTrue(Schema::hasColumn($table, $col), "{$table}.{$col} tidak ada");
            }
            $this->assertFalse(Schema::hasColumn($table, 'crack_count'), "{$table} tidak boleh memakai crack_count");
        }
    }

    public function test_master_models_and_demo_accounts(): void
    {
        $this->assertGreaterThanOrEqual(15, MotorcycleModel::count());
        $this->assertSame(0, MotorcycleModel::where('standard_price', '<=', 0)->count());

        $admin = User::where('email', 'admin@motolens.id')->firstOrFail();
        $user = User::where('email', 'user@motolens.id')->firstOrFail();
        $this->assertTrue($admin->hasRole('admin'));
        $this->assertFalse($admin->hasRole('user'));
        $this->assertTrue($user->hasRole('user'));
        $this->assertFalse($user->hasRole('admin'));
        $this->assertTrue(Hash::check(config('motolens.seed.admin_password'), $admin->password));
        $this->assertTrue(Hash::check(config('motolens.seed.user_password'), $user->password));
        $this->assertSame(0, $admin->motorcycles()->count(), 'Admin bukan penjual.');
        $this->assertGreaterThan(0, $user->motorcycles()->count());
    }

    public function test_inquiries_are_consistent_with_listing_status_and_ownership(): void
    {
        $this->assertGreaterThanOrEqual(10, Inquiry::count());

        foreach (Inquiry::with('motorcycle')->get() as $q) {
            $this->assertNotSame($q->motorcycle->user_id, $q->buyer_id, 'Pembeli tidak boleh pemilik listing.');
        }
        foreach (Motorcycle::withStatus(ListingStatus::Booked)->get() as $m) {
            $this->assertTrue($m->inquiries()->where('status', 'accepted')->exists(), "Listing booked {$m->id} tanpa inquiry accepted");
        }
        foreach (Motorcycle::withStatus(ListingStatus::Sold)->get() as $m) {
            $this->assertTrue($m->inquiries()->where('status', 'completed')->exists());
        }
        foreach (Inquiry::active()->upcoming()->get() as $q) {
            $this->assertTrue($q->appointment_date->isFuture());
        }
        $this->assertEqualsCanonicalizing(
            ['accepted', 'cancelled', 'completed', 'pending', 'rejected'],
            Inquiry::query()->distinct()->pluck('status')->map->value->all()
        );
    }

    public function test_price_histories_match_current_seller_price(): void
    {
        $this->assertGreaterThanOrEqual(10, MotorcyclePriceHistory::count());

        foreach (MotorcyclePriceHistory::with('motorcycle')->get() as $h) {
            $this->assertGreaterThan($h->new_price, $h->old_price);
            $this->assertSame($h->motorcycle->seller_price, $h->new_price);
            $this->assertSame($h->motorcycle->user_id, $h->changed_by);
        }
    }

    public function test_each_listing_has_a_placeholder_photo_marked_as_placeholder(): void
    {
        foreach (Motorcycle::all() as $m) {
            $media = $m->getFirstMedia(Motorcycle::MEDIA_MAIN_PHOTO);
            $this->assertNotNull($media, "Listing {$m->id} tanpa foto placeholder");
            $this->assertTrue($media->getCustomProperty('is_placeholder'));
            Storage::disk('public')->assertExists($media->getPathRelativeToRoot());
        }
    }

    public function test_seeder_is_idempotent(): void
    {
        $counts = fn () => [
            Motorcycle::count(), MotorcycleInspection::count(), User::count(), MotorcycleModel::count(),
            Inquiry::count(), MotorcyclePriceHistory::count(), Media::count(),
            Role::count(),
        ];
        $before = $counts();

        $this->seed(DatabaseSeeder::class);

        $this->assertSame($before, $counts());
    }

    public function test_seeded_listing_snapshot_carries_seed_key(): void
    {
        $this->assertSame(58, MotorcycleInspection::seedDemo()->whereNotNull('price_calculation_snapshot->seed_key')->count());
    }
}
