<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed data demo MotoLens. Aman dijalankan berulang (idempotent).
     * Semua data inspeksi bawaan bertanda source_type = seed_demo.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            UserSeeder::class,
            MotorcycleModelSeeder::class,
            MotorcycleSeeder::class,
            InquirySeeder::class,
        ]);
    }
}
