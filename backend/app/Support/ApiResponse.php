<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ApiResponse
{
    /**
     * Format standard success response.
     *
     * @param  array<string, mixed>  $meta
     */
    public static function success(
        mixed $data = null,
        string $message = 'Operasi berhasil dilakukan.',
        int $statusCode = Response::HTTP_OK,
        array $meta = []
    ): JsonResponse {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data ?? new \stdClass,
            'meta' => empty($meta) ? new \stdClass : $meta,
        ];

        return response()->json($response, $statusCode);
    }

    /**
     * Format standard created response (201).
     *
     * @param  array<string, mixed>  $meta
     */
    public static function created(
        mixed $data = null,
        string $message = 'Data berhasil dibuat.',
        array $meta = []
    ): JsonResponse {
        return self::success($data, $message, Response::HTTP_CREATED, $meta);
    }

    /**
     * Format standard error response.
     */
    public static function error(
        string $message = 'Terjadi kesalahan.',
        int $statusCode = Response::HTTP_BAD_REQUEST,
        mixed $errors = null
    ): JsonResponse {
        $formattedErrors = null;
        if ($errors !== null) {
            $formattedErrors = is_array($errors) && empty($errors) ? new \stdClass : $errors;
        } else {
            $formattedErrors = new \stdClass;
        }

        $response = [
            'success' => false,
            'message' => $message,
            'errors' => $formattedErrors,
            'data' => null,
        ];

        return response()->json($response, $statusCode);
    }
}
