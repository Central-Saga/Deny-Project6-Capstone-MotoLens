<?php

use App\Enums\InspectionStatus;
use App\Enums\SourceType;
use App\Enums\VerificationStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motorcycle_inspections', function (Blueprint $table) {
            $table->id();
            // Inspeksi dapat dibuat sebelum listing terbit; riwayat tidak boleh hilang saat listing dihapus.
            $table->foreignId('motorcycle_id')->nullable()->constrained('motorcycles')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();

            // Identitas model yang dipakai saat inspeksi (PRD Bab 3.9).
            $table->string('model_name', 100);
            $table->string('model_version', 50);
            $table->string('model_sha256', 64)->nullable();
            $table->decimal('confidence_threshold', 4, 3);
            $table->decimal('nms_iou_threshold', 4, 3)->nullable();

            // source_type dipisahkan dari verification_status (PRD Bab 5.5 & 11.3).
            $table->enum('source_type', SourceType::values());
            $table->enum('inspection_status', InspectionStatus::values())->default(InspectionStatus::Pending->value);

            // Foto asli/anotasi disimpan di Spatie media; di sini hanya referensi id (FK ditambah di bawah).
            $table->unsignedBigInteger('raw_photo_media_id')->nullable();
            $table->unsignedBigInteger('annotated_photo_media_id')->nullable();
            $table->unsignedInteger('image_width')->nullable();
            $table->unsignedInteger('image_height')->nullable();

            $table->unsignedSmallInteger('scratch_count')->default(0);
            $table->unsignedSmallInteger('dent_count')->default(0);
            $table->unsignedSmallInteger('accident_count')->default(0);
            $table->decimal('average_confidence', 5, 4)->nullable();
            $table->unsignedSmallInteger('total_damages_detected')->default(0);
            $table->jsonb('detections_json')->nullable();
            $table->unsignedInteger('inference_time_ms')->nullable();

            $table->unsignedBigInteger('base_depreciated_price')->nullable();
            $table->unsignedBigInteger('ml_predicted_price')->nullable();
            $table->decimal('damage_penalty_percent', 5, 2)->nullable();
            $table->jsonb('price_calculation_snapshot')->nullable();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('location_accuracy_m', 8, 2)->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->enum('verification_status', VerificationStatus::values())->default(VerificationStatus::Unverified->value);

            $table->string('error_code', 60)->nullable();
            $table->string('error_message_safe', 255)->nullable();
            $table->timestamps();

            $table->index(['motorcycle_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('source_type');
            $table->index('inspection_status');
            $table->index('model_version');
        });

        Schema::table('motorcycle_inspections', function (Blueprint $table) {
            $table->foreign('raw_photo_media_id')->references('id')->on('media')->nullOnDelete();
            $table->foreign('annotated_photo_media_id')->references('id')->on('media')->nullOnDelete();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE motorcycle_inspections ADD CONSTRAINT motorcycle_inspections_threshold_range CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1)');
            DB::statement('ALTER TABLE motorcycle_inspections ADD CONSTRAINT motorcycle_inspections_nms_range CHECK (nms_iou_threshold IS NULL OR (nms_iou_threshold >= 0 AND nms_iou_threshold <= 1))');
            DB::statement('ALTER TABLE motorcycle_inspections ADD CONSTRAINT motorcycle_inspections_penalty_range CHECK (damage_penalty_percent IS NULL OR (damage_penalty_percent >= 0 AND damage_penalty_percent <= 30))');
            DB::statement('ALTER TABLE motorcycle_inspections ADD CONSTRAINT motorcycle_inspections_dimensions_positive CHECK (image_width > 0 AND image_height > 0)');
            DB::statement('ALTER TABLE motorcycle_inspections ADD CONSTRAINT motorcycle_inspections_total_matches_counts CHECK (total_damages_detected = scratch_count + dent_count + accident_count)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('motorcycle_inspections');
    }
};
