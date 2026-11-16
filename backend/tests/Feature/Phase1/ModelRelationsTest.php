<?php

namespace Tests\Feature\Phase1;

use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\SourceType;
use App\Models\Inquiry;
use App\Models\InspectionFeedback;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\MotorcycleModel;
use App\Models\MotorcyclePriceHistory;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Skema, relasi Eloquent, scope, dan factory (DoD Fase 1).
 */
class ModelRelationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_required_tables_and_spatie_tables_exist(): void
    {
        foreach ([
            'users', 'motorcycle_models', 'motorcycles', 'motorcycle_inspections', 'inquiries',
            'inspection_feedback', 'motorcycle_price_histories', 'motorcycle_favorites', 'reports',
            'roles', 'permissions', 'model_has_roles', 'role_has_permissions', 'model_has_permissions',
            'media', 'activity_log', 'notifications',
        ] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Tabel {$table} tidak ada");
        }
    }

    public function test_motorcycle_relations(): void
    {
        $motorcycle = Motorcycle::factory()->approved()->create();

        $this->assertInstanceOf(User::class, $motorcycle->seller);
        $this->assertInstanceOf(MotorcycleModel::class, $motorcycle->motorcycleModel);
        $this->assertInstanceOf(MotorcycleInspection::class, $motorcycle->latestInspection);
        $this->assertTrue($motorcycle->inspections->contains($motorcycle->latestInspection));
        $this->assertSame($motorcycle->id, $motorcycle->latestInspection->motorcycle->id);
        $this->assertTrue($motorcycle->seller->motorcycles->contains($motorcycle));
        $this->assertTrue($motorcycle->motorcycleModel->motorcycles->contains($motorcycle));
    }

    public function test_bidirectional_foreign_keys_work_and_inspection_history_is_not_overwritten(): void
    {
        $motorcycle = Motorcycle::factory()->create();
        $first = $motorcycle->latestInspection;

        $second = MotorcycleInspection::factory()->forListing($motorcycle)->create();
        $motorcycle->update(['latest_inspection_id' => $second->id]);

        $this->assertSame(2, $motorcycle->inspections()->count());
        $this->assertSame($second->id, $motorcycle->fresh()->latest_inspection_id);
        $this->assertNotNull(MotorcycleInspection::find($first->id), 'Riwayat lama tetap ada.');
    }

    public function test_inspection_can_exist_before_listing_is_published(): void
    {
        $inspection = MotorcycleInspection::factory()->androidCamera()->create(['motorcycle_id' => null]);

        $this->assertNull($inspection->motorcycle_id);
        $this->assertNull($inspection->motorcycle);
        $this->assertSame(SourceType::AndroidCamera, $inspection->source_type);
        $this->assertSame('unverified', $inspection->verification_status->value, 'android_camera tidak otomatis verified');
    }

    public function test_soft_deleting_a_listing_keeps_inspection_history_and_hides_from_public_scope(): void
    {
        $motorcycle = Motorcycle::factory()->approved()->create();
        $inspectionId = $motorcycle->latest_inspection_id;

        $this->assertSame(1, Motorcycle::publiclyVisible()->count());
        $motorcycle->delete();

        $this->assertSame(0, Motorcycle::publiclyVisible()->count());
        $this->assertNotNull(MotorcycleInspection::find($inspectionId));
        $this->assertNotNull(MotorcycleInspection::find($inspectionId)->motorcycle, 'withTrashed pada relasi inspeksi');
    }

    public function test_force_deleting_a_listing_nulls_inspection_reference_instead_of_deleting_history(): void
    {
        $motorcycle = Motorcycle::factory()->create();
        $inspectionId = $motorcycle->latest_inspection_id;

        $motorcycle->forceDelete();

        $this->assertNotNull(MotorcycleInspection::find($inspectionId));
        $this->assertNull(MotorcycleInspection::find($inspectionId)->motorcycle_id);
    }

    public function test_failed_inspection_is_not_zero_damage_result(): void
    {
        $inspection = MotorcycleInspection::factory()->androidCamera()->failed('model_missing')->create();

        $this->assertSame('failed', $inspection->inspection_status->value);
        $this->assertNull($inspection->detections_json);
        $this->assertNull($inspection->ml_predicted_price);
        $this->assertSame('model_missing', $inspection->error_code);
        $this->assertNull(MotorcycleInspection::completed()->find($inspection->id));
    }

    public function test_public_scope_excludes_pending_and_rejected(): void
    {
        Motorcycle::factory()->approved()->count(2)->create();
        Motorcycle::factory()->pending()->create();
        Motorcycle::factory()->rejected()->create();

        $this->assertSame(2, Motorcycle::publiclyVisible()->count());
        $this->assertSame(1, Motorcycle::pending()->count());
    }

    public function test_catalog_scopes_filter_and_sort(): void
    {
        $honda = MotorcycleModel::factory()->create(['brand' => 'Honda', 'model_name' => 'Vario 160', 'standard_price' => 28_000_000]);
        $yamaha = MotorcycleModel::factory()->create(['brand' => 'Yamaha', 'model_name' => 'NMAX', 'standard_price' => 34_000_000]);
        $cheap = Motorcycle::factory()->approved()->forModel($honda)->state(['seller_price' => 12_000_000, 'location_address' => 'Kuta, Badung, Bali', 'created_at' => now()->subDays(3)])->create();
        $mid = Motorcycle::factory()->approved()->forModel($honda)->state(['seller_price' => 18_000_000, 'location_address' => 'Denpasar Selatan, Denpasar, Bali', 'created_at' => now()->subDays(2)])->create();
        $pricey = Motorcycle::factory()->approved()->forModel($yamaha)->state(['seller_price' => 30_000_000, 'location_address' => 'Ubud, Gianyar, Bali', 'created_at' => now()->subDay()])->create();

        $this->assertEqualsCanonicalizing([$cheap->id, $mid->id], Motorcycle::ofBrand('Honda')->pluck('id')->all());
        $this->assertSame([$mid->id], Motorcycle::priceBetween(15_000_000, 20_000_000)->pluck('id')->all());
        $this->assertSame([$cheap->id], Motorcycle::priceBetween(null, 12_000_000)->pluck('id')->all());
        $this->assertSame([$pricey->id], Motorcycle::inLocation('ubud')->pluck('id')->all());
        $this->assertSame([$pricey->id], Motorcycle::search('nmax')->pluck('id')->all());
        $this->assertSame([$cheap->id, $mid->id, $pricey->id], Motorcycle::sortBy('price_asc')->pluck('id')->all());
        $this->assertSame([$pricey->id, $mid->id, $cheap->id], Motorcycle::sortBy('price_desc')->pluck('id')->all());
        $this->assertSame($pricey->id, Motorcycle::sortBy('newest')->first()->id);
        $this->assertSame(3, Motorcycle::search(null)->count());
    }

    public function test_price_label_and_grade_scopes(): void
    {
        $good = Motorcycle::factory()->askingRatio(0.80)->withDamage(0, 0, 0)->create();
        $over = Motorcycle::factory()->askingRatio(1.30)->withDamage(0, 3, 0)->create(); // Dent x3 = 15% > 10% -> perlu_perbaikan

        $this->assertSame('good_deal', $good->price_label->value);
        $this->assertSame('mulus', $good->condition_grade->value);
        $this->assertSame('overpriced', $over->price_label->value);
        $this->assertSame('perlu_perbaikan', $over->condition_grade->value);
        $this->assertSame([$good->id], Motorcycle::withPriceLabel('good_deal')->pluck('id')->all());
        $this->assertSame([$over->id], Motorcycle::withConditionGrade('perlu_perbaikan')->pluck('id')->all());
    }

    public function test_inquiry_relations_and_scopes(): void
    {
        $motorcycle = Motorcycle::factory()->approved()->create();
        $buyer = User::factory()->create();
        $inquiry = Inquiry::factory()->create(['motorcycle_id' => $motorcycle->id, 'buyer_id' => $buyer->id]);

        $this->assertTrue($inquiry->buyer->is($buyer));
        $this->assertTrue($inquiry->motorcycle->is($motorcycle));
        $this->assertTrue($inquiry->seller->is($motorcycle->seller));
        $this->assertTrue($buyer->inquiries->contains($inquiry));
        $this->assertTrue($motorcycle->inquiries->contains($inquiry));
        $this->assertSame(1, Inquiry::forBuyer($buyer)->count());
        $this->assertSame(1, Inquiry::forSeller($motorcycle->seller)->count());
        $this->assertSame(1, Inquiry::active()->count());
        $this->assertSame(0, Inquiry::withStatus('completed')->count());
    }

    public function test_favorites_pivot_is_unique(): void
    {
        $user = User::factory()->create();
        $motorcycle = Motorcycle::factory()->create();

        $user->favoriteMotorcycles()->attach($motorcycle->id);
        $this->assertTrue($user->favoriteMotorcycles->contains($motorcycle));
        $this->assertTrue($motorcycle->favoritedBy->contains($user));

        $this->expectException(QueryException::class);
        $user->favoriteMotorcycles()->attach($motorcycle->id);
    }

    public function test_feedback_report_and_price_history_relations(): void
    {
        $motorcycle = Motorcycle::factory()->create();
        $user = User::factory()->create();

        $feedback = InspectionFeedback::factory()->create(['inspection_id' => $motorcycle->latest_inspection_id, 'submitted_by' => $user->id]);
        $report = Report::factory()->create(['motorcycle_id' => $motorcycle->id, 'reporter_id' => $user->id]);
        $history = MotorcyclePriceHistory::factory()->create(['motorcycle_id' => $motorcycle->id, 'changed_by' => $user->id]);

        $this->assertTrue($feedback->inspection->is($motorcycle->latestInspection));
        $this->assertTrue($motorcycle->latestInspection->feedback->contains($feedback));
        $this->assertTrue($feedback->submitter->is($user));
        $this->assertSame('pending', $feedback->review_status->value);
        $this->assertTrue($report->reporter->is($user));
        $this->assertTrue($motorcycle->reports->contains($report));
        $this->assertTrue($user->reports->contains($report));
        $this->assertTrue($motorcycle->priceHistories->contains($history));
        $this->assertTrue($history->changedBy->is($user));
    }

    public function test_user_has_roles_and_role_is_not_mass_assignable(): void
    {
        Role::findOrCreate('admin', 'web');
        Role::findOrCreate('user', 'web');

        $user = User::factory()->create();
        $user->assignRole('user');
        $this->assertTrue($user->hasRole('user'));
        $this->assertFalse($user->isAdmin());

        $this->assertNotContains('role', (new User)->getFillable());
        $this->assertNotContains('roles', (new User)->getFillable());
        $this->assertArrayNotHasKey('password', $user->toArray());
    }

    public function test_models_use_required_traits(): void
    {
        $this->assertContains(\Spatie\Permission\Traits\HasRoles::class, class_uses_recursive(User::class));
        $this->assertContains(\Spatie\MediaLibrary\InteractsWithMedia::class, class_uses_recursive(Motorcycle::class));
        $this->assertContains(\Spatie\MediaLibrary\InteractsWithMedia::class, class_uses_recursive(MotorcycleInspection::class));
        foreach ([Motorcycle::class, MotorcycleModel::class, MotorcycleInspection::class, Inquiry::class] as $model) {
            $this->assertContains(\Spatie\Activitylog\Traits\LogsActivity::class, class_uses_recursive($model));
        }
    }

    public function test_casts_for_enums_money_and_json(): void
    {
        $motorcycle = Motorcycle::factory()->create();
        $inspection = $motorcycle->latestInspection;

        $this->assertIsInt($motorcycle->seller_price);
        $this->assertIsInt($motorcycle->ml_predicted_price);
        $this->assertInstanceOf(\App\Enums\TaxStatus::class, $motorcycle->tax_status);
        $this->assertInstanceOf(ListingStatus::class, $motorcycle->status);
        $this->assertInstanceOf(ModerationStatus::class, $motorcycle->moderation_status);
        $this->assertIsArray($inspection->detections_json);
        $this->assertIsArray($inspection->price_calculation_snapshot);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $motorcycle->created_at);
    }

    public function test_reference_price_changes_are_traceable_in_activity_log(): void
    {
        $model = MotorcycleModel::factory()->create(['standard_price' => 20_000_000]);
        $model->update(['standard_price' => 21_000_000]);

        $log = Activity::where('log_name', 'motorcycle_model')->where('description', 'updated')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertSame(21_000_000, (int) $log->properties['attributes']['standard_price']);
        $this->assertSame(20_000_000, (int) $log->properties['old']['standard_price']);
    }

    public function test_activity_log_for_listing_excludes_coordinates_and_secrets(): void
    {
        $motorcycle = Motorcycle::factory()->create();
        $motorcycle->update(['moderation_status' => 'approved']);

        $log = Activity::where('log_name', 'motorcycle')->where('description', 'updated')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertArrayNotHasKey('latitude', $log->properties['attributes']);
        $this->assertArrayNotHasKey('longitude', $log->properties['attributes']);
    }

    public function test_factory_derived_values_follow_overrides(): void
    {
        $model = MotorcycleModel::factory()->create(['standard_price' => 25_000_000]);
        $m = Motorcycle::factory()->forModel($model)->state(['year' => (int) now()->year, 'odometer_km' => 0, 'tax_status' => 'active'])
            ->withDamage(0, 0, 0)->askingRatio(1.0)->create();

        $this->assertSame(25_000_000, $m->base_depreciated_price);
        $this->assertSame(25_000_000, $m->ml_predicted_price);
        $this->assertSame('fair_price', $m->price_label->value);
        $this->assertSame('mulus', $m->condition_grade->value);
        $this->assertEquals(0, (float) $m->damage_penalty_percent);
    }
}
