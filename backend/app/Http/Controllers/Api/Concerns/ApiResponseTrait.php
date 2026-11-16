<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponseTrait
{
    protected function successResponse(
        mixed $data = null,
        string $message = 'Operasi berhasil dilakukan.',
        int $statusCode = Response::HTTP_OK,
        array $meta = []
    ): JsonResponse {
        return ApiResponse::success($data, $message, $statusCode, $meta);
    }

    protected function createdResponse(
        mixed $data = null,
        string $message = 'Data berhasil dibuat.',
        array $meta = []
    ): JsonResponse {
        return ApiResponse::created($data, $message, $meta);
    }

    protected function errorResponse(
        string $message = 'Terjadi kesalahan.',
        int $statusCode = Response::HTTP_BAD_REQUEST,
        mixed $errors = null
    ): JsonResponse {
        return ApiResponse::error($message, $statusCode, $errors);
    }
}
