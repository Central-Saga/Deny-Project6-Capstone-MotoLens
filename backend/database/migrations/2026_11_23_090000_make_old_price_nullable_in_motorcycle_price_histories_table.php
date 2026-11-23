<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motorcycle_price_histories', function (Blueprint $table) {
            $table->unsignedBigInteger('old_price')->nullable()->change();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE motorcycle_price_histories DROP CONSTRAINT IF EXISTS motorcycle_price_histories_prices_positive');
            DB::statement('ALTER TABLE motorcycle_price_histories ADD CONSTRAINT motorcycle_price_histories_prices_positive CHECK ((old_price IS NULL OR old_price > 0) AND new_price > 0)');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE motorcycle_price_histories DROP CONSTRAINT IF EXISTS motorcycle_price_histories_prices_positive');
            DB::statement('ALTER TABLE motorcycle_price_histories ADD CONSTRAINT motorcycle_price_histories_prices_positive CHECK (old_price > 0 AND new_price > 0)');
        }
    }
};
