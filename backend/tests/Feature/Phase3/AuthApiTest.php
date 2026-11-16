<?php

namespace Tests\Feature\Phase3;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_user_can_register_and_receives_sanctum_token(): void
    {
        $payload = [
            'name' => 'Wayan Sukadana',
            'email' => 'wayan@motolens.id',
            'password' => 'Password123!',
            'phone_whatsapp' => '081234567890',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Registrasi akun berhasil.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'roles', 'is_admin'],
                    'token',
                    'token_type',
                ],
                'meta',
            ]);

        $this->assertDatabaseHas('users', ['email' => 'wayan@motolens.id']);
        $user = User::where('email', 'wayan@motolens.id')->first();
        $this->assertTrue($user->hasRole('user'));
        $this->assertFalse($user->hasRole('admin'));
    }

    public function test_registration_strictly_assigns_role_user_even_if_admin_requested(): void
    {
        $payload = [
            'name' => 'Hacker Wannabe',
            'email' => 'hacker@motolens.id',
            'password' => 'Password123!',
            'role' => 'admin',
            'roles' => ['admin'],
            'is_admin' => true,
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201);

        $user = User::where('email', 'hacker@motolens.id')->first();
        $this->assertTrue($user->hasRole('user'));
        $this->assertFalse($user->hasRole('admin'));
    }

    public function test_registration_validation_fails_for_invalid_input(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => '',
            'email' => 'invalid-email',
            'password' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validasi gagal.',
                'data' => null,
            ])
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::create([
            'name' => 'Made Developer',
            'email' => 'made@motolens.id',
            'password' => Hash::make('Password123!'),
        ]);
        $user->assignRole('user');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'made@motolens.id',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login berhasil.',
            ])
            ->assertJsonPath('data.user.email', 'made@motolens.id');

        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::create([
            'name' => 'Nyoman Demo',
            'email' => 'nyoman@motolens.id',
            'password' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'nyoman@motolens.id',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Kredensial yang diberikan tidak valid.',
                'data' => null,
            ]);
    }

    public function test_authenticated_user_can_access_me_profile(): void
    {
        $user = User::create([
            'name' => 'Ketut Profile',
            'email' => 'ketut@motolens.id',
            'password' => Hash::make('Password123!'),
        ]);
        $user->assignRole('user');

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Ketut Profile')
            ->assertJsonPath('data.email', 'ketut@motolens.id');
    }

    public function test_unauthenticated_user_cannot_access_me(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Akses tidak terautentikasi.',
                'data' => null,
            ]);
    }

    public function test_user_can_logout_and_revokes_token(): void
    {
        $user = User::create([
            'name' => 'Gede Logout',
            'email' => 'gede@motolens.id',
            'password' => Hash::make('Password123!'),
        ]);
        $user->assignRole('user');

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logout berhasil. Token telah dicabut.',
            ]);

        $this->assertCount(0, $user->fresh()->tokens);
    }
}
