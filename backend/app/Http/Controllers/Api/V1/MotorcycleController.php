<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ConditionGrade;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\TaxStatus;
use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMotorcycleRequest;
use App\Http\Requests\UpdateMotorcycleRequest;
use App\Http\Resources\MotorcycleDetailResource;
use App\Http\Resources\MotorcycleResource;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Models\MotorcyclePriceHistory;
use App\Services\PriceEstimationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class MotorcycleController extends Controller
{
    use ApiResponseTrait;

    public function __construct(protected PriceEstimationService $priceService)
    {
    }

    /**
     * Katalog listing publik (approved only) dengan filter lengkap & paginasi.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 15)));
        $page = max(1, (int) $request->query('page', 1));
        $sort = $request->query('sort', 'newest');

        $brand = $request->query('brand');
        $model = $request->query('model');
        $year = $request->filled('year') ? (int) $request->query('year') : null;
        $minPrice = $request->filled('min_price') ? (int) $request->query('min_price') : null;
        $maxPrice = $request->filled('max_price') ? (int) $request->query('max_price') : null;
        $priceLabel = $request->query('price_label');
        $conditionGrade = $request->query('condition_grade');
        $location = $request->query('location');
        $search = $request->query('search');

        $version = Cache::get('catalog_cache_version', 1);
        $cacheKey = "catalog_v{$version}_".md5(serialize([
            $brand, $model, $year, $minPrice, $maxPrice, $priceLabel,
            $conditionGrade, $location, $search, $sort, $page, $perPage,
        ]));

        $result = Cache::remember($cacheKey, 300, function () use (
            $brand, $model, $year, $minPrice, $maxPrice, $priceLabel,
            $conditionGrade, $location, $search, $sort, $perPage
        ) {
            $query = Motorcycle::query()
                ->publiclyVisible()
                ->with(['motorcycleModel', 'seller', 'media']);

            if ($brand) {
                $query->ofBrand($brand);
            }
            if ($model) {
                $query->ofModelName($model);
            }
            if ($year !== null) {
                $query->ofYear($year);
            }
            if ($minPrice !== null || $maxPrice !== null) {
                $query->priceBetween($minPrice, $maxPrice);
            }
            if ($priceLabel) {
                $query->withPriceLabel($priceLabel);
            }
            if ($conditionGrade) {
                $query->withConditionGrade($conditionGrade);
            }
            if ($location) {
                $query->inLocation($location);
            }
            if ($search) {
                $query->search($search);
            }

            $query->sortBy($sort);

            $paginator = $query->paginate($perPage);

            return [
                'items' => MotorcycleResource::collection($paginator->items()),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
            ];
        });

        return $this->successResponse(
            data: $result['items'],
            message: 'Katalog motor berhasil diambil.',
            meta: $result['meta']
        );
    }

    /**
     * Komparasi 2–3 unit motor bekas berdampingan.
     */
    public function compare(Request $request): JsonResponse
    {
        $rawIds = $request->query('ids', '');
        $ids = array_filter(array_map('intval', explode(',', (string) $rawIds)));

        if (count($ids) < 2 || count($ids) > 3) {
            return $this->errorResponse(
                message: 'Komparasi membutuhkan minimal 2 dan maksimal 3 ID unit motor.',
                statusCode: Response::HTTP_UNPROCESSABLE_ENTITY,
                errors: ['ids' => ['Parameter ids harus berisi 2 atau 3 ID yang dipisahkan koma (contoh: ?ids=1,2).']]
            );
        }

        $motorcycles = Motorcycle::whereIn('id', $ids)
            ->publiclyVisible()
            ->with(['motorcycleModel', 'seller', 'latestInspection', 'media'])
            ->get();

        if ($motorcycles->count() < 2) {
            return $this->errorResponse(
                message: 'Sebagian atau seluruh unit motor untuk komparasi tidak ditemukan atau belum disetujui.',
                statusCode: Response::HTTP_NOT_FOUND
            );
        }

        return $this->successResponse(
            data: MotorcycleDetailResource::collection($motorcycles),
            message: 'Data komparasi motor berhasil diambil.'
        );
    }

    /**
     * Detail listing publik beserta Sertifikat Inspeksi AI & Explainable Price Breakdown.
     */
    public function show(int $id): JsonResponse
    {
        $motorcycle = Motorcycle::with(['motorcycleModel', 'seller', 'latestInspection', 'media'])
            ->findOrFail($id);

        Gate::authorize('view', $motorcycle);

        return $this->successResponse(
            data: new MotorcycleDetailResource($motorcycle),
            message: 'Detail motor berhasil diambil.'
        );
    }

    /**
     * Daftar listing milik pengguna yang sedang login (Garasi Saya).
     */
    public function myMotorcycles(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 15)));

        $paginator = Motorcycle::where('user_id', $request->user()->id)
            ->with(['motorcycleModel', 'media', 'latestInspection'])
            ->latest('id')
            ->paginate($perPage);

        return $this->successResponse(
            data: MotorcycleResource::collection($paginator->items()),
            message: 'Daftar motor saya berhasil diambil.',
            meta: [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ]
        );
    }

    /**
     * Terbitkan iklan listing baru dari hasil inspeksi AI.
     */
    public function store(StoreMotorcycleRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $inspection = MotorcycleInspection::findOrFail($validated['inspection_id']);

        // Pastikan hanya pemilik inspeksi atau admin yang dapat menerbitkan listing dari inspeksi ini
        if ($inspection->user_id !== $user->id && ! $user->hasRole('admin')) {
            return $this->errorResponse(
                message: 'Anda tidak memiliki hak akses untuk menggunakan hasil inspeksi ini.',
                statusCode: Response::HTTP_FORBIDDEN
            );
        }

        $snapshot = $inspection->price_calculation_snapshot ?? [];
        $modelId = $snapshot['motorcycle_model_id'] ?? null;
        if (! $modelId && $inspection->motorcycle_id) {
            $modelId = $inspection->motorcycle?->motorcycle_model_id;
        }

        $priceLabel = $this->priceService->labelFor(
            $validated['seller_price'],
            $inspection->ml_predicted_price ?? $validated['seller_price']
        );

        $conditionGrade = $snapshot['condition_grade'] ?? null;
        if ($conditionGrade instanceof ConditionGrade) {
            $conditionGrade = $conditionGrade->value;
        } elseif (! is_string($conditionGrade) || ! in_array($conditionGrade, ConditionGrade::values(), true)) {
            $conditionGrade = ConditionGrade::Mulus->value;
        }

        $motorcycle = Motorcycle::create([
            'user_id' => $user->id,
            'motorcycle_model_id' => $modelId ?? 1,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'year' => (int) ($snapshot['vehicle_year'] ?? now()->year),
            'odometer_km' => (int) ($snapshot['odometer_km'] ?? 0),
            'tax_status' => $snapshot['tax_status'] ?? TaxStatus::Active->value,
            'location_address' => $validated['location_address'],
            'latitude' => $validated['latitude'] ?? $inspection->latitude,
            'longitude' => $validated['longitude'] ?? $inspection->longitude,
            'seller_price' => $validated['seller_price'],
            'base_depreciated_price' => $inspection->base_depreciated_price ?? $validated['seller_price'],
            'ml_predicted_price' => $inspection->ml_predicted_price ?? $validated['seller_price'],
            'price_label' => $priceLabel?->value,
            'condition_grade' => $conditionGrade,
            'scratch_count' => (int) $inspection->scratch_count,
            'dent_count' => (int) $inspection->dent_count,
            'accident_count' => (int) $inspection->accident_count,
            'damage_penalty_percent' => $inspection->damage_penalty_percent ?? 0,
            'latest_inspection_id' => $inspection->id,
            'is_camera_verified' => (bool) ($inspection->verification_status?->value === 'submitted'),
            'verification_status' => $inspection->verification_status ?? 'pending',
            'status' => ListingStatus::Available->value,
            'moderation_status' => ModerationStatus::Pending->value,
        ]);

        // Hubungkan inspeksi ke unit motor
        $inspection->update(['motorcycle_id' => $motorcycle->id]);

        // Copy media dari inspeksi ke foto utama motor bila tersedia
        $annotatedMedia = $inspection->getFirstMedia(MotorcycleInspection::MEDIA_ANNOTATED_PHOTO);
        if ($annotatedMedia && file_exists($annotatedMedia->getPath())) {
            $motorcycle->addMedia($annotatedMedia->getPath())
                ->preservingOriginal()
                ->toMediaCollection(Motorcycle::MEDIA_MAIN_PHOTO);
        }

        // Catat riwayat harga awal
        MotorcyclePriceHistory::create([
            'motorcycle_id' => $motorcycle->id,
            'old_price' => null,
            'new_price' => $validated['seller_price'],
            'changed_by' => $user->id,
        ]);

        $this->invalidateCatalogCache();

        $motorcycle->load(['motorcycleModel', 'seller', 'latestInspection', 'media']);

        return $this->createdResponse(
            data: new MotorcycleDetailResource($motorcycle),
            message: 'Iklan motor berhasil diterbitkan dan menunggu moderasi admin.'
        );
    }

    /**
     * Perbarui data listing (harga, deskripsi, lokasi, status ketersediaan).
     */
    public function update(UpdateMotorcycleRequest $request, int $id): JsonResponse
    {
        $motorcycle = Motorcycle::findOrFail($id);
        Gate::authorize('update', $motorcycle);

        $validated = $request->validated();
        $user = $request->user();

        if (isset($validated['seller_price']) && (int) $validated['seller_price'] !== (int) $motorcycle->seller_price) {
            $oldPrice = $motorcycle->seller_price;
            $newPrice = (int) $validated['seller_price'];

            MotorcyclePriceHistory::create([
                'motorcycle_id' => $motorcycle->id,
                'old_price' => $oldPrice,
                'new_price' => $newPrice,
                'changed_by' => $user->id,
            ]);

            $validated['price_label'] = $this->priceService->labelFor(
                $newPrice,
                $motorcycle->ml_predicted_price ?? $newPrice
            )?->value;
        }

        $motorcycle->update($validated);

        $this->invalidateCatalogCache();

        $motorcycle->load(['motorcycleModel', 'seller', 'latestInspection', 'media']);

        return $this->successResponse(
            data: new MotorcycleDetailResource($motorcycle),
            message: 'Listing motor berhasil diperbarui.'
        );
    }

    /**
     * Hapus / arsipkan listing motor secara aman (Soft Delete).
     */
    public function destroy(int $id): JsonResponse
    {
        $motorcycle = Motorcycle::findOrFail($id);
        Gate::authorize('delete', $motorcycle);

        $motorcycle->delete();

        $this->invalidateCatalogCache();

        return $this->successResponse(
            data: null,
            message: 'Listing motor berhasil diarsipkan.'
        );
    }

    /**
     * Invalidate cache katalog pasar.
     */
    protected function invalidateCatalogCache(): void
    {
        if (Cache::has('catalog_cache_version')) {
            Cache::increment('catalog_cache_version');
        } else {
            Cache::forever('catalog_cache_version', 2);
        }
    }
}
