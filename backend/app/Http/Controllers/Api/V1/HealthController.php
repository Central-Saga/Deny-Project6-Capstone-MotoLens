<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Process\Process;

class HealthController extends Controller
{
    use ApiResponseTrait;

    /**
     * Endpoint health check sistem (PostgreSQL, Cache, Model ONNX, dan Python binary).
     */
    public function health(): JsonResponse
    {
        $status = 'healthy';
        $checks = [];

        // 1. Database Check (PostgreSQL)
        try {
            DB::connection()->getPdo();
            $checks['database'] = [
                'status' => 'connected',
                'driver' => DB::getDriverName(),
            ];
        } catch (\Throwable $e) {
            $status = 'unhealthy';
            $checks['database'] = [
                'status' => 'disconnected',
                'error' => 'Gagal terhubung ke database.',
            ];
        }

        // 2. Cache Check (Redis / File / Array)
        try {
            Cache::put('health_check_ping', 'pong', 10);
            $pong = Cache::get('health_check_ping');
            $checks['cache'] = [
                'status' => $pong === 'pong' ? 'connected' : 'degraded',
                'store' => config('cache.default'),
            ];
        } catch (\Throwable $e) {
            $checks['cache'] = [
                'status' => 'disconnected',
                'store' => config('cache.default'),
            ];
        }

        // 3. Model ONNX Check
        $modelPath = config('motolens.ml.model_path', storage_path('app/ml/model_damage.onnx'));
        $modelExists = File::exists($modelPath);
        $checks['ml_model'] = [
            'status' => $modelExists ? 'available' : 'missing',
            'path' => basename($modelPath),
            'size_bytes' => $modelExists ? File::size($modelPath) : 0,
        ];

        // 4. Python Binary Check
        $pythonBinary = config('motolens.ml.python_binary', 'python');
        try {
            $process = new Process([$pythonBinary, '--version']);
            $process->run();
            $checks['python'] = [
                'status' => $process->isSuccessful() ? 'available' : 'unavailable',
                'binary' => $pythonBinary,
                'version' => trim($process->getOutput() ?: $process->getErrorOutput()),
            ];
        } catch (\Throwable $e) {
            $checks['python'] = [
                'status' => 'unavailable',
                'binary' => $pythonBinary,
            ];
        }

        $httpCode = $status === 'healthy' ? Response::HTTP_OK : Response::HTTP_SERVICE_UNAVAILABLE;

        return $this->successResponse(
            data: [
                'status' => $status,
                'timestamp' => now()->toISOString(),
                'version' => 'v1.0.0',
                'checks' => $checks,
            ],
            message: $status === 'healthy' ? 'Seluruh layanan sistem berjalan normal.' : 'Sebagian layanan mengalami kendala.',
            statusCode: $httpCode
        );
    }
}
