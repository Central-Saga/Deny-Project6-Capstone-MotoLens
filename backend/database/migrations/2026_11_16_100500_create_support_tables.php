<?php

use App\Enums\FeedbackReviewStatus;
use App\Enums\FeedbackType;
use App\Enums\ReportStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel pendukung PRD Bab 5.8: inspection_feedback, motorcycle_price_histories,
 * motorcycle_favorites, reports.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('motorcycle_inspections')->cascadeOnDelete();
            $table->foreignId('submitted_by')->constrained('users')->restrictOnDelete();
            $table->enum('feedback_type', FeedbackType::values());
            $table->text('comment')->nullable();
            $table->enum('review_status', FeedbackReviewStatus::values())->default(FeedbackReviewStatus::Pending->value);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['inspection_id', 'review_status']);
        });

        Schema::create('motorcycle_price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('motorcycle_id')->constrained('motorcycles')->cascadeOnDelete();
            $table->unsignedBigInteger('old_price')->nullable();
            $table->unsignedBigInteger('new_price');
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['motorcycle_id', 'created_at']);
        });

        Schema::create('motorcycle_favorites', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('motorcycle_id')->constrained('motorcycles')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'motorcycle_id']);
            $table->index('motorcycle_id');
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('motorcycle_id')->constrained('motorcycles')->cascadeOnDelete();
            $table->foreignId('reporter_id')->constrained('users')->restrictOnDelete();
            $table->string('reason', 120);
            $table->text('description')->nullable();
            $table->enum('status', ReportStatus::values())->default(ReportStatus::Open->value);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['motorcycle_id', 'status']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE motorcycle_price_histories ADD CONSTRAINT motorcycle_price_histories_prices_positive CHECK ((old_price IS NULL OR old_price > 0) AND new_price > 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
        Schema::dropIfExists('motorcycle_favorites');
        Schema::dropIfExists('motorcycle_price_histories');
        Schema::dropIfExists('inspection_feedback');
    }
};
