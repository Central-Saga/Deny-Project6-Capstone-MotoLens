<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AdminMotorcycleModelController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\InquiryController;
use App\Http\Controllers\Api\V1\InspectionController;
use App\Http\Controllers\Api\V1\MotorcycleController;
use App\Http\Controllers\Api\V1\MotorcycleModelController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - MotoLens V1 REST API (PRD Bab 6)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // --- Public Endpoints (Bab 6.2, 6.3, 12.5)
    Route::get('/health', [HealthController::class, 'health']);

    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
    });

    Route::get('/motorcycle-models', [MotorcycleModelController::class, 'index']);
    Route::get('/motorcycles', [MotorcycleController::class, 'index']);
    Route::get('/motorcycles/compare', [MotorcycleController::class, 'compare']);
    Route::get('/motorcycles/{id}', [MotorcycleController::class, 'show'])->whereNumber('id');

    // --- Authenticated Endpoints (Bab 6.2 s/d 6.5)
    Route::middleware('auth:sanctum')->group(function () {

        Route::prefix('auth')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });

        // Garasi Saya & Manajemen Listing
        Route::get('/my-motorcycles', [MotorcycleController::class, 'myMotorcycles']);
        Route::post('/motorcycles', [MotorcycleController::class, 'store']);
        Route::match(['put', 'patch'], '/motorcycles/{id}', [MotorcycleController::class, 'update'])->whereNumber('id');
        Route::delete('/motorcycles/{id}', [MotorcycleController::class, 'destroy'])->whereNumber('id');

        // Inspeksi AI & Sertifikat
        Route::post('/motorcycles/inspect', [InspectionController::class, 'inspect'])->middleware('throttle:inspect');
        Route::get('/inspections/{id}', [InspectionController::class, 'show'])->whereNumber('id');
        Route::get('/motorcycles/{id}/inspections', [InspectionController::class, 'byMotorcycle'])->whereNumber('id');
        Route::post('/inspections/{id}/feedback', [InspectionController::class, 'feedback'])->whereNumber('id');

        // Booking & Survei Fisik
        Route::get('/inquiries', [InquiryController::class, 'index']);
        Route::post('/inquiries', [InquiryController::class, 'store']);
        Route::patch('/inquiries/{id}/status', [InquiryController::class, 'updateStatus'])->whereNumber('id');
        Route::post('/inquiries/{id}/cancel', [InquiryController::class, 'cancel'])->whereNumber('id');

        // --- Admin Endpoints (Bab 6.6 - Spatie role:admin)
        Route::prefix('admin')->middleware('role:admin')->group(function () {
            Route::get('/dashboard', [AdminController::class, 'dashboard']);
            Route::get('/activity-logs', [AdminController::class, 'activityLogs']);
            Route::get('/motorcycles', [AdminController::class, 'motorcycles']);
            Route::patch('/motorcycles/{id}/moderation', [AdminController::class, 'moderateListing'])->whereNumber('id');
            Route::get('/inspections/metrics', [AdminController::class, 'inspectionMetrics']);

            // CRUD Model Referensi Motor
            Route::post('/motorcycle-models', [AdminMotorcycleModelController::class, 'store']);
            Route::match(['put', 'patch'], '/motorcycle-models/{id}', [AdminMotorcycleModelController::class, 'update'])->whereNumber('id');
            Route::delete('/motorcycle-models/{id}', [AdminMotorcycleModelController::class, 'destroy'])->whereNumber('id');
        });
    });
});
