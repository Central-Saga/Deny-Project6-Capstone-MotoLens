<?php

namespace Tests\Feature\Phase1;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DemoAccountSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_passwords_come_from_environment_config(): void
    {
        config(['motolens.seed.admin_password' => 'Custom-Admin-1!', 'motolens.seed.user_password' => 'Custom-User-1!']);

        $this->seed(RolePermissionSeeder::class);
        $this->seed(UserSeeder::class);

        $this->assertTrue(Hash::check('Custom-Admin-1!', User::where('email', 'admin@motolens.id')->first()->password));
        $this->assertTrue(Hash::check('Custom-User-1!', User::where('email', 'user@motolens.id')->first()->password));
    }

    public function test_default_demo_password_is_documented_default_and_not_stored_in_plain_text(): void
    {
        $this->assertSame('Password123!', config('motolens.seed.admin_password'));
        $this->assertSame('Password123!', config('motolens.seed.user_password'));

        $this->seed(RolePermissionSeeder::class);
        $this->seed(UserSeeder::class);

        $stored = User::where('email', 'admin@motolens.id')->value('password');
        $this->assertNotSame('Password123!', $stored);
        $this->assertTrue(Hash::isHashed($stored));
    }

    public function test_user_seeder_is_idempotent_and_assigns_exactly_one_role(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $this->seed(UserSeeder::class);
        $count = User::count();
        $this->seed(UserSeeder::class);
        $this->seed(RolePermissionSeeder::class);

        $this->assertSame($count, User::count());
        $this->assertCount(1, User::where('email', 'admin@motolens.id')->first()->roles);
        $this->assertSame(['admin'], User::where('email', 'admin@motolens.id')->first()->getRoleNames()->all());
        $this->assertSame(['user'], User::where('email', 'user@motolens.id')->first()->getRoleNames()->all());
    }
}

