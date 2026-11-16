<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use App\Http\Resources\MotorcycleResource;
use App\Models\Motorcycle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    use ApiResponseTrait;

    /**
     * Daftar motor yang difavoritkan oleh pengguna aktif.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min(50, max(1, (int) $request->query('per_page', 15)));

        $paginator = $user->favoriteMotorcycles()
            ->with(['motorcycleModel', 'seller', 'media'])
            ->latest('motorcycle_favorites.created_at')
            ->paginate($perPage);

        return $this->successResponse(
            data: MotorcycleResource::collection($paginator->items()),
            message: 'Daftar motor favorit berhasil diambil.',
            meta: [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ]
        );
    }

    /**
     * Tambah atau hapus (toggle) unit motor dari daftar favorit pengguna.
     */
    public function toggle(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $motorcycle = Motorcycle::findOrFail($id);

        $exists = $user->favoriteMotorcycles()->where('motorcycle_id', $motorcycle->id)->exists();

        if ($exists) {
            $user->favoriteMotorcycles()->detach($motorcycle->id);
            $isFavorited = false;
            $message = 'Motor berhasil dihapus dari daftar favorit.';
        } else {
            $user->favoriteMotorcycles()->attach($motorcycle->id);
            $isFavorited = true;
            $message = 'Motor berhasil ditambahkan ke daftar favorit.';
        }

        return $this->successResponse(
            data: [
                'motorcycle_id' => $motorcycle->id,
                'is_favorited' => $isFavorited,
            ],
            message: $message
        );
    }
}

