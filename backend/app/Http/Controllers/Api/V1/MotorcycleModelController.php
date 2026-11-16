<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use App\Http\Resources\MotorcycleModelResource;
use App\Models\MotorcycleModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MotorcycleModelController extends Controller
{
    use ApiResponseTrait;

    /**
     * Menampilkan daftar model referensi motor yang aktif untuk inspeksi & katalog.
     */
    public function index(Request $request): JsonResponse
    {
        $brand = $request->query('brand');
        $search = $request->query('search');
        $category = $request->query('category');

        $cacheKey = 'models_list_'.md5(serialize([$brand, $search, $category]));

        $models = Cache::remember($cacheKey, 600, function () use ($brand, $search, $category) {
            return MotorcycleModel::where('is_active', true)
                ->when($brand, fn ($q) => $q->where('brand', $brand))
                ->when($category, fn ($q) => $q->where('category', $category))
                ->when($search, fn ($q) => $q->where(function ($query) use ($search) {
                    $query->where('model_name', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%");
                }))
                ->orderBy('brand')
                ->orderBy('model_name')
                ->get();
        });

        return $this->successResponse(
            data: MotorcycleModelResource::collection($models),
            message: 'Daftar model referensi berhasil diambil.'
        );
    }
}
