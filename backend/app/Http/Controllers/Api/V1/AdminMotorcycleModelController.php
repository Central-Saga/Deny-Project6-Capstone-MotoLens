<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMotorcycleModelRequest;
use App\Http\Requests\UpdateMotorcycleModelRequest;
use App\Http\Resources\MotorcycleModelResource;
use App\Models\MotorcycleModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class AdminMotorcycleModelController extends Controller
{
    use ApiResponseTrait;

    /**
     * Tambahkan master model referensi motor baru.
     */
    public function store(StoreMotorcycleModelRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $model = MotorcycleModel::create($validated);

        $this->clearModelCache();

        return $this->createdResponse(
            data: new MotorcycleModelResource($model),
            message: 'Model referensi motor berhasil ditambahkan.'
        );
    }

    /**
     * Perbarui master model referensi motor.
     */
    public function update(UpdateMotorcycleModelRequest $request, int $id): JsonResponse
    {
        $model = MotorcycleModel::findOrFail($id);

        $model->update($request->validated());

        $this->clearModelCache();

        return $this->successResponse(
            data: new MotorcycleModelResource($model),
            message: 'Model referensi motor berhasil diperbarui.'
        );
    }

    /**
     * Nonaktifkan atau hapus master model referensi secara aman.
     */
    public function destroy(int $id): JsonResponse
    {
        $model = MotorcycleModel::findOrFail($id);

        // Jika model sudah dipakai oleh listing, nonaktifkan is_active agar tidak merusak relasi
        if ($model->motorcycles()->exists()) {
            $model->update(['is_active' => false]);
            $message = 'Model referensi berhasil dinonaktifkan karena telah digunakan pada listing motor.';
        } else {
            $model->delete();
            $message = 'Model referensi motor berhasil dihapus.';
        }

        $this->clearModelCache();

        return $this->successResponse(
            data: null,
            message: $message
        );
    }

    protected function clearModelCache(): void
    {
        Cache::flush();
    }
}
