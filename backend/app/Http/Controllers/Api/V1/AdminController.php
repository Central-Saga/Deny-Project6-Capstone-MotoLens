<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\InspectionStatus;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\VerificationStatus;
use App\Events\ListingModerationStatusChanged;
use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateModerationRequest;
use App\Http\Resources\ActivityLogResource;
use App\Http\Resources\MotorcycleDetailResource;
use App\Http\Resources\MotorcycleResource;
use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\User;
use App\Notifications\ListingModeratedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class AdminController extends Controller
{
    use ApiResponseTrait;

    /**
     * Ringkasan dashboard analitik pasar, moderasi & statistik deteksi AI.
     */
    public function dashboard(): JsonResponse
    {
        $totalListings = Motorcycle::count();
        $approvedListings = Motorcycle::where('moderation_status', ModerationStatus::Approved->value)->count();
        $pendingModeration = Motorcycle::where('moderation_status', ModerationStatus::Pending->value)->count();
        $rejectedListings = Motorcycle::where('moderation_status', ModerationStatus::Rejected->value)->count();
        $totalCatalogValue = (int) Motorcycle::where('moderation_status', ModerationStatus::Approved->value)->sum('seller_price');

        // Distribusi price label pada listing approved
        $priceLabels = Motorcycle::where('moderation_status', ModerationStatus::Approved->value)
            ->select('price_label', DB::raw('count(*) as count'))
            ->groupBy('price_label')
            ->pluck('count', 'price_label')
            ->toArray();

        // Distribusi grade kondisi
        $conditionGrades = Motorcycle::where('moderation_status', ModerationStatus::Approved->value)
            ->select('condition_grade', DB::raw('count(*) as count'))
            ->groupBy('condition_grade')
            ->pluck('count', 'condition_grade')
            ->toArray();

        // Statistik kerusakan visual
        $damageStats = [
            'total_scratches' => (int) MotorcycleInspection::where('inspection_status', InspectionStatus::Completed->value)->sum('scratch_count'),
            'total_dents' => (int) MotorcycleInspection::where('inspection_status', InspectionStatus::Completed->value)->sum('dent_count'),
            'total_accidents' => (int) MotorcycleInspection::where('inspection_status', InspectionStatus::Completed->value)->sum('accident_count'),
        ];

        return $this->successResponse(
            data: [
                'overview' => [
                    'total_listings' => $totalListings,
                    'approved_listings' => $approvedListings,
                    'pending_moderation' => $pendingModeration,
                    'rejected_listings' => $rejectedListings,
                    'total_catalog_value' => $totalCatalogValue,
                    'total_inspections' => MotorcycleInspection::count(),
                    'total_inquiries' => Inquiry::count(),
                    'total_users' => User::count(),
                ],
                'price_label_distribution' => [
                    'good_deal' => $priceLabels['good_deal'] ?? 0,
                    'fair_price' => $priceLabels['fair_price'] ?? 0,
                    'above_market' => $priceLabels['above_market'] ?? 0,
                ],
                'condition_grade_distribution' => [
                    'A' => $conditionGrades['A'] ?? 0,
                    'B' => $conditionGrades['B'] ?? 0,
                    'C' => $conditionGrades['C'] ?? 0,
                    'D' => $conditionGrades['D'] ?? 0,
                ],
                'damage_detection_stats' => $damageStats,
            ],
            message: 'Data ringkasan dashboard admin berhasil diambil.'
        );
    }

    /**
     * Audit log paginasi untuk aktivitas sistem tanpa membocorkan data rahasia.
     */
    public function activityLogs(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $logName = $request->query('log_name');

        $query = Activity::with('causer')->latest('id');

        if ($logName) {
            $query->where('log_name', $logName);
        }

        $paginator = $query->paginate($perPage);

        return $this->successResponse(
            data: ActivityLogResource::collection($paginator->items()),
            message: 'Audit activity logs berhasil diambil.',
            meta: [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ]
        );
    }

    /**
     * Daftar seluruh listing motor untuk keperluan moderasi admin.
     */
    public function motorcycles(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 15)));
        $status = $request->query('moderation_status');

        $query = Motorcycle::with(['motorcycleModel', 'seller', 'media'])->latest('id');

        if ($status) {
            $query->where('moderation_status', $status);
        }

        $paginator = $query->paginate($perPage);

        return $this->successResponse(
            data: MotorcycleResource::collection($paginator->items()),
            message: 'Daftar moderasi motor berhasil diambil.',
            meta: [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ]
        );
    }

    /**
     * Setujui (Approve) atau Tolak (Reject) listing motor yang diajukan penjual.
     */
    public function moderateListing(UpdateModerationRequest $request, int $id): JsonResponse
    {
        $motorcycle = Motorcycle::findOrFail($id);
        $oldStatus = $motorcycle->moderation_status;

        $validated = $request->validated();
        $newStatus = ModerationStatus::from($validated['moderation_status']);
        $reason = $validated['rejection_reason'] ?? null;

        $motorcycle->moderation_status = $newStatus;
        $motorcycle->save();

        // Invalidate cache katalog
        if (Cache::has('catalog_cache_version')) {
            Cache::increment('catalog_cache_version');
        } else {
            Cache::forever('catalog_cache_version', 2);
        }

        // Trigger Event & Notification ke penjual
        event(new ListingModerationStatusChanged($motorcycle, $oldStatus, $newStatus, $reason));

        if ($seller = $motorcycle->seller) {
            $seller->notify(new ListingModeratedNotification($motorcycle, $newStatus, $reason));
        }

        $motorcycle->load(['motorcycleModel', 'seller', 'latestInspection', 'media']);

        return $this->successResponse(
            data: new MotorcycleDetailResource($motorcycle),
            message: "Listing motor berhasil diubah status moderasinya menjadi {$newStatus->value}."
        );
    }

    /**
     * Metrik inferensi YOLOv8 dan akurasi model ML.
     */
    public function inspectionMetrics(): JsonResponse
    {
        $totalInspections = MotorcycleInspection::count();
        $completed = MotorcycleInspection::where('inspection_status', InspectionStatus::Completed->value);
        $failedCount = MotorcycleInspection::where('inspection_status', InspectionStatus::Failed->value)->count();

        $avgInferenceTime = (int) $completed->avg('inference_time_ms');
        $minInferenceTime = (int) $completed->min('inference_time_ms');
        $maxInferenceTime = (int) $completed->max('inference_time_ms');
        $avgConfidence = round((float) $completed->avg('average_confidence'), 4);

        $totalScratches = (int) $completed->sum('scratch_count');
        $totalDents = (int) $completed->sum('dent_count');
        $totalAccidents = (int) $completed->sum('accident_count');

        $verifiedCount = MotorcycleInspection::where('verification_status', VerificationStatus::Submitted->value)->count();

        return $this->successResponse(
            data: [
                'total_inspections' => $totalInspections,
                'completed_inspections' => $completed->count(),
                'failed_inspections' => $failedCount,
                'verified_camera_inspections' => $verifiedCount,
                'inference_time_ms' => [
                    'average' => $avgInferenceTime,
                    'min' => $minInferenceTime,
                    'max' => $maxInferenceTime,
                ],
                'accuracy_metrics' => [
                    'average_confidence' => $avgConfidence,
                    'detections_by_class' => [
                        'scratch' => $totalScratches,
                        'dent' => $totalDents,
                        'accident' => $totalAccidents,
                        'total' => $totalScratches + $totalDents + $totalAccidents,
                    ],
                ],
            ],
            message: 'Metrik performa model inspeksi AI berhasil diambil.'
        );
    }
}
