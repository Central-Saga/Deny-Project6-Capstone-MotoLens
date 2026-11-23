<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\FeedbackReviewStatus;
use App\Enums\SourceType;
use App\Enums\TaxStatus;
use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use App\Http\Requests\InspectMotorcycleRequest;
use App\Http\Requests\StoreInspectionFeedbackRequest;
use App\Http\Resources\MotorcycleInspectionResource;
use App\Models\InspectionFeedback;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Services\YoloInspectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class InspectionController extends Controller
{
    use ApiResponseTrait;

    public function __construct(protected YoloInspectionService $inspectionService) {}

    /**
     * Jalankan inspeksi AI pada foto bodi motor via YOLOv8 ONNX pipeline.
     */
    public function inspect(InspectMotorcycleRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $metadata = array_filter([
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'location_accuracy_m' => $validated['location_accuracy_m'] ?? null,
            'captured_at' => $validated['captured_at'] ?? null,
            'capture_metadata' => $validated['capture_metadata'] ?? [],
        ]);

        $inspection = $this->inspectionService->inspect(
            photo: $request->file('photo'),
            userId: $user->id,
            motorcycleModelId: (int) $validated['motorcycle_model_id'],
            year: (int) $validated['year'],
            odometerKm: (int) $validated['odometer_km'],
            taxStatus: TaxStatus::from($validated['tax_status']),
            sellerPrice: isset($validated['seller_price']) ? (int) $validated['seller_price'] : null,
            sourceType: isset($validated['source_type'])
                ? SourceType::from($validated['source_type'])
                : SourceType::WebUpload,
            metadata: $metadata
        );

        return $this->createdResponse(
            data: new MotorcycleInspectionResource($inspection),
            message: 'Inspeksi AI bodi motor berhasil diselesaikan.'
        );
    }

    /**
     * Detail sertifikat / hasil inspeksi motor.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $inspection = MotorcycleInspection::with(['motorcycle', 'media'])->findOrFail($id);
        $user = $request->user();

        if ($inspection->user_id !== $user->id && ! $user->hasRole('admin')) {
            return $this->errorResponse(
                message: 'Anda tidak memiliki hak akses untuk melihat hasil inspeksi ini.',
                statusCode: Response::HTTP_FORBIDDEN
            );
        }

        return $this->successResponse(
            data: new MotorcycleInspectionResource($inspection),
            message: 'Detail inspeksi motor berhasil diambil.'
        );
    }

    /**
     * Riwayat seluruh inspeksi yang pernah dilakukan pada suatu unit motor.
     */
    public function byMotorcycle(int $motorcycleId): JsonResponse
    {
        $motorcycle = Motorcycle::findOrFail($motorcycleId);

        // Hanya pemilik unit atau admin yang berhak melihat riwayat inspeksi
        if ($motorcycle->user_id !== auth()->id() && ! auth()->user()?->hasRole('admin')) {
            return $this->errorResponse(
                message: 'Anda tidak memiliki hak akses untuk melihat riwayat inspeksi unit ini.',
                statusCode: Response::HTTP_FORBIDDEN
            );
        }

        $inspections = MotorcycleInspection::where('motorcycle_id', $motorcycleId)
            ->with(['media'])
            ->latest('id')
            ->get();

        return $this->successResponse(
            data: MotorcycleInspectionResource::collection($inspections),
            message: 'Riwayat inspeksi unit motor berhasil diambil.'
        );
    }

    /**
     * Kirim feedback koreksi hasil deteksi AI inspeksi ke tabel inspection_feedback.
     */
    public function feedback(StoreInspectionFeedbackRequest $request, int $id): JsonResponse
    {
        $inspection = MotorcycleInspection::findOrFail($id);
        $user = $request->user();

        Gate::authorize('feedback', $inspection);

        $validated = $request->validated();

        $feedback = InspectionFeedback::create([
            'inspection_id' => $inspection->id,
            'submitted_by' => $user->id,
            'feedback_type' => $validated['feedback_type'] ?? 'other',
            'comment' => $validated['comment'] ?? $validated['notes'] ?? null,
            'review_status' => FeedbackReviewStatus::Pending->value,
        ]);

        return $this->createdResponse(
            data: [
                'feedback_id' => $feedback->id,
                'inspection_id' => $inspection->id,
                'feedback_type' => $feedback->feedback_type->value,
                'review_status' => $feedback->review_status->value,
            ],
            message: 'Feedback inspeksi berhasil dikirim dan akan ditinjau tim QA/ML.'
        );
    }
}
