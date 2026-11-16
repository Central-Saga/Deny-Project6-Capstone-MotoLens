<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    use ApiResponseTrait;

    /**
     * Registrasi pengguna publik baru (Role 'user' ditetapkan secara server-side).
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone_whatsapp' => $validated['phone_whatsapp'] ?? null,
        ]);

        // Tetapkan role 'user' secara server-side; role admin dilarang keras dari publik
        $user->assignRole('user');

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->createdResponse([
            'user' => new UserResource($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Registrasi akun berhasil.');
    }

    /**
     * Autentikasi dan login pengguna, menerbitkan personal access token Sanctum.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return $this->errorResponse(
                message: 'Kredensial yang diberikan tidak valid.',
                statusCode: Response::HTTP_UNAUTHORIZED
            );
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'user' => new UserResource($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Login berhasil.');
    }

    /**
     * Revoke personal access token yang sedang aktif.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->successResponse(
            data: null,
            message: 'Logout berhasil. Token telah dicabut.'
        );
    }

    /**
     * Ambil data profil pengguna yang sedang login beserta role-nya.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->successResponse(
            data: new UserResource($request->user()),
            message: 'Profil pengguna berhasil diambil.'
        );
    }
}
