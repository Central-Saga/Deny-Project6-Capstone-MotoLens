<?php

use App\Enums\ConditionGrade;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\PriceLabel;
use App\Enums\TaxStatus;
use App\Enums\VerificationStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `latest_inspection_id` dibuat sebagai kolom biasa di sini; foreign key-nya
     * ditambahkan oleh migration 2026_11_16_100300 setelah motorcycle_inspections ada
     * (referensi dua arah, PRD Bab 5.4 & 5.5).
     */
    public function up(): void
    {
        Schema::create('motorcycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('motorcycle_model_id')->constrained('motorcycle_models')->restrictOnDelete();
            $table->string('title', 180);
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('year');
            $table->unsignedInteger('odometer_km');
            $table->enum('tax_status', TaxStatus::values());
            $table->string('location_address', 200);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->unsignedBigInteger('seller_price');
            $table->unsignedBigInteger('base_depreciated_price')->nullable();
            $table->unsignedBigInteger('ml_predicted_price')->nullable();
            $table->enum('price_label', PriceLabel::values())->nullable();
            $table->enum('condition_grade', ConditionGrade::values())->nullable();
            $table->unsignedSmallInteger('scratch_count')->default(0);
            $table->unsignedSmallInteger('dent_count')->default(0);
            $table->unsignedSmallInteger('accident_count')->default(0);
            $table->decimal('damage_penalty_percent', 5, 2)->default(0);
            $table->unsignedBigInteger('latest_inspection_id')->nullable()->index();
            $table->boolean('is_camera_verified')->default(false);
            $table->enum('verification_status', VerificationStatus::values())->default(VerificationStatus::Unverified->value);
            $table->enum('status', ListingStatus::values())->default(ListingStatus::Available->value);
            $table->enum('moderation_status', ModerationStatus::values())->default(ModerationStatus::Pending->value);
            $table->timestamps();
            $table->softDeletes();

            // Index untuk katalog publik, filter, dan sort (PRD Bab 6.3).
            $table->index(['moderation_status', 'status', 'deleted_at'], 'motorcycles_catalog_visibility_index');
            $table->index('year');
            $table->index('seller_price');
            $table->index('price_label');
            $table->index('condition_grade');
            $table->index('location_address');
            $table->index('created_at');
            $table->index(['user_id', 'status']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE motorcycles ADD CONSTRAINT motorcycles_seller_price_positive CHECK (seller_price > 0)');
            DB::statement('ALTER TABLE motorcycles ADD CONSTRAINT motorcycles_year_range CHECK (year >= 1980)');
            DB::statement('ALTER TABLE motorcycles ADD CONSTRAINT motorcycles_damage_penalty_range CHECK (damage_penalty_percent >= 0 AND damage_penalty_percent <= 30)');
            DB::statement('ALTER TABLE motorcycles ADD CONSTRAINT motorcycles_counts_non_negative CHECK (scratch_count >= 0 AND dent_count >= 0 AND accident_count >= 0 AND odometer_km >= 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('motorcycles');
    }
};
