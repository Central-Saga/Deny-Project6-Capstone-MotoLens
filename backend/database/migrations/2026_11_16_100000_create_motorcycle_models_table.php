<?php

use App\Enums\MotorcycleCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motorcycle_models', function (Blueprint $table) {
            $table->id();
            $table->string('brand', 50)->index();
            $table->string('model_name', 100);
            $table->unsignedInteger('engine_cc');
            $table->enum('category', MotorcycleCategory::values());
            $table->unsignedBigInteger('standard_price');
            $table->string('price_source', 150)->nullable();
            $table->date('price_reference_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['brand', 'model_name', 'engine_cc'], 'motorcycle_models_brand_model_cc_unique');
            $table->index(['is_active', 'category']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE motorcycle_models ADD CONSTRAINT motorcycle_models_standard_price_positive CHECK (standard_price > 0)');
            DB::statement('ALTER TABLE motorcycle_models ADD CONSTRAINT motorcycle_models_engine_cc_positive CHECK (engine_cc > 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('motorcycle_models');
    }
};

