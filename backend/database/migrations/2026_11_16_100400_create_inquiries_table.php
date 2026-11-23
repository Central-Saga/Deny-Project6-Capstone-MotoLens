<?php

use App\Enums\InquiryStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('motorcycle_id')->constrained('motorcycles')->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('appointment_date');
            $table->unsignedBigInteger('offered_price')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', InquiryStatus::values())->default(InquiryStatus::Pending->value);
            $table->timestamp('seller_response_at')->nullable();
            $table->timestamps();

            $table->index(['motorcycle_id', 'status']);
            $table->index(['buyer_id', 'status']);
            $table->index('appointment_date');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE inquiries ADD CONSTRAINT inquiries_offered_price_positive CHECK (offered_price IS NULL OR offered_price > 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
