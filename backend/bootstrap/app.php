<?php

use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                if ($e instanceof ValidationException) {
                    return ApiResponse::error(
                        message: 'Validasi gagal.',
                        statusCode: Response::HTTP_UNPROCESSABLE_ENTITY,
                        errors: $e->errors()
                    );
                }

                if ($e instanceof AuthenticationException) {
                    return ApiResponse::error(
                        message: 'Akses tidak terautentikasi.',
                        statusCode: Response::HTTP_UNAUTHORIZED
                    );
                }

                if ($e instanceof AuthorizationException || $e instanceof AccessDeniedHttpException) {
                    return ApiResponse::error(
                        message: 'Akses ditolak.',
                        statusCode: Response::HTTP_FORBIDDEN
                    );
                }

                if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                    return ApiResponse::error(
                        message: 'Sumber daya tidak ditemukan.',
                        statusCode: Response::HTTP_NOT_FOUND
                    );
                }

                if ($e instanceof ConflictHttpException) {
                    return ApiResponse::error(
                        message: $e->getMessage() ?: 'Konflik data terdeteksi.',
                        statusCode: Response::HTTP_CONFLICT
                    );
                }

                if ($e instanceof ThrottleRequestsException || $e instanceof TooManyRequestsHttpException) {
                    return ApiResponse::error(
                        message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
                        statusCode: Response::HTTP_TOO_MANY_REQUESTS
                    );
                }

                if ($e instanceof HttpExceptionInterface) {
                    $statusCode = $e->getStatusCode();
                    $message = $e->getMessage() ?: (Response::$statusTexts[$statusCode] ?? 'Terjadi kesalahan HTTP.');

                    return ApiResponse::error(
                        message: $message,
                        statusCode: $statusCode
                    );
                }

                // Generic unhandled exception (500) - Never leak stack traces or server paths
                report($e);

                return ApiResponse::error(
                    message: 'Terjadi kesalahan pada server.',
                    statusCode: Response::HTTP_INTERNAL_SERVER_ERROR
                );
            }
        });
    })->create();
