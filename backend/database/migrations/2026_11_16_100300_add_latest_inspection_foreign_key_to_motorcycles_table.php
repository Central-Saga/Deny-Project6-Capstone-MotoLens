<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Foreign key dua arah (PRD Bab 5.4 & 5.5):
 *   motorcycles.latest_inspection_id -> motorcycle_inspections.id
 *   motorcycle_inspections.motorcycle_id -> motorcycles.id
 * Constraint kedua dibuat belakangan agar migrate:fresh berjalan tanpa error urutan tabel.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motorcycles', function (Blueprint $table) {
            $table->foreign('latest_inspection_id')
                ->references('id')
                ->on('motorcycle_inspections')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('motorcycles', function (Blueprint $table) {
            $table->dropForeign(['latest_inspection_id']);
        });
    }
};
