<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Akun demo (PRD Bab 11.5 & 14.2). Password HANYA dari environment demo
 * (DEMO_ADMIN_PASSWORD / DEMO_USER_PASSWORD, default `Password123!` sesuai keputusan developer).
 * Akun demo bersifat publik: jangan dipakai pada production berisi data nyata.
 */
class UserSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'admin@motolens.id';

    public const USER_EMAIL = 'user@motolens.id';

    /** Penjual/pembeli demo tambahan (role user) untuk variasi kepemilikan listing. */
    public const EXTRA_USERS = [
        ['email' => 'made.wirawan@motolens.id', 'name' => 'Made Wirawan', 'phone' => '081200000001'],
        ['email' => 'putu.lestari@motolens.id', 'name' => 'Putu Ayu Lestari', 'phone' => '081200000002'],
        ['email' => 'komang.suryawan@motolens.id', 'name' => 'Komang Suryawan', 'phone' => '081200000003'],
        ['email' => 'nyoman.dharma@motolens.id', 'name' => 'Nyoman Dharma', 'phone' => '081200000004'],
        ['email' => 'ketut.arimbawa@motolens.id', 'name' => 'Ketut Arimbawa', 'phone' => '081200000005'],
    ];

    public function run(): void
    {
        $adminPassword = (string) config('motolens.seed.admin_password');
        $userPassword = (string) config('motolens.seed.user_password');

        $admin = User::firstOrCreate(
            ['email' => self::ADMIN_EMAIL],
            ['name' => 'Admin MotoLens', 'password' => $adminPassword, 'phone_whatsapp' => '081236009999', 'email_verified_at' => now()],
        );
        if (! $admin->phone_whatsapp) {
            $admin->update(['phone_whatsapp' => '081236009999']);
        }
        $admin->syncRoles(['admin']);

        $demo = User::firstOrCreate(
            ['email' => self::USER_EMAIL],
            ['name' => 'Demo User', 'password' => $userPassword, 'phone_whatsapp' => '081200000000', 'email_verified_at' => now()],
        );
        if (! $demo->phone_whatsapp) {
            $demo->update(['phone_whatsapp' => '081200000000']);
        }
        $demo->syncRoles(['user']);

        foreach (self::EXTRA_USERS as $row) {
            $user = User::firstOrCreate(
                ['email' => $row['email']],
                ['name' => $row['name'], 'password' => $userPassword, 'phone_whatsapp' => $row['phone'], 'email_verified_at' => now()],
            );
            $user->syncRoles(['user']);
        }
    }
}

