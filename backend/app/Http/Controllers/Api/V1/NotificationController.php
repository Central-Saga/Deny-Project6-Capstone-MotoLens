<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponseTrait;

    /**
     * Daftar notifikasi user beserta total unread_count.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min(50, max(1, (int) $request->query('per_page', 15)));

        $paginator = $user->notifications()->latest()->paginate($perPage);
        $unreadCount = $user->unreadNotifications()->count();

        return $this->successResponse(
            data: NotificationResource::collection($paginator->items()),
            message: 'Daftar notifikasi berhasil diambil.',
            meta: [
                'unread_count' => $unreadCount,
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ]
        );
    }

    /**
     * Tandai satu notifikasi tertentu sebagai telah dibaca.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return $this->successResponse(
            data: new NotificationResource($notification->fresh()),
            message: 'Notifikasi berhasil ditandai telah dibaca.',
            meta: [
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ]
        );
    }

    /**
     * Tandai seluruh notifikasi user sebagai telah dibaca sekaligus.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->unreadNotifications()->update(['read_at' => now()]);

        return $this->successResponse(
            data: null,
            message: 'Seluruh notifikasi berhasil ditandai telah dibaca.',
            meta: [
                'unread_count' => 0,
            ]
        );
    }
}
