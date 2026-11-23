<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Events\InquiryCreated;
use App\Events\InquiryStatusUpdated;
use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInquiryRequest;
use App\Http\Requests\UpdateInquiryStatusRequest;
use App\Http\Resources\InquiryResource;
use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Notifications\InquiryStatusUpdatedNotification;
use App\Notifications\NewInquiryNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InquiryController extends Controller
{
    use ApiResponseTrait;

    /**
     * Daftar inquiry / booking survei milik pengguna (sebagai pembeli atau penjual).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $request->query('role');
        $perPage = min(50, max(1, (int) $request->query('per_page', 15)));

        $query = Inquiry::query()->with(['motorcycle.motorcycleModel', 'motorcycle.seller', 'buyer']);

        if ($role === 'buyer') {
            $query->forBuyer($user->id);
        } elseif ($role === 'seller') {
            $query->forSeller($user->id);
        } else {
            $query->where(function ($q) use ($user) {
                $q->forBuyer($user->id)
                    ->orWhereHas('motorcycle', fn ($m) => $m->where('user_id', $user->id));
            });
        }

        $paginator = $query->latest('id')->paginate($perPage);

        return $this->successResponse(
            data: InquiryResource::collection($paginator->items()),
            message: 'Daftar jadwal survei berhasil diambil.',
            meta: [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ]
        );
    }

    /**
     * Ajukan jadwal survei fisik baru untuk suatu unit motor.
     */
    public function store(StoreInquiryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $motorcycle = Motorcycle::findOrFail($validated['motorcycle_id']);

        // Pemilik tidak boleh mengajukan booking pada motor miliknya sendiri
        if ($motorcycle->user_id === $user->id) {
            return $this->errorResponse(
                message: 'Anda tidak dapat mengajukan survei pada motor milik Anda sendiri.',
                statusCode: Response::HTTP_UNPROCESSABLE_ENTITY,
                errors: ['motorcycle_id' => ['Anda adalah pemilik unit motor ini.']]
            );
        }

        // Motor harus approved dan berstatus available
        if ($motorcycle->moderation_status !== ModerationStatus::Approved) {
            return $this->errorResponse(
                message: 'Unit motor ini belum disetujui atau tidak tersedia untuk disurvei.',
                statusCode: Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        // Cek konflik: pembeli tidak boleh memiliki booking pending ganda pada motor yang sama
        $existing = Inquiry::where('motorcycle_id', $motorcycle->id)
            ->where('buyer_id', $user->id)
            ->whereIn('status', [InquiryStatus::Pending->value, InquiryStatus::Accepted->value])
            ->first();

        if ($existing) {
            return $this->errorResponse(
                message: 'Anda sudah memiliki jadwal survei aktif yang sedang menunggu atau telah dikonfirmasi untuk unit ini.',
                statusCode: Response::HTTP_CONFLICT,
                errors: ['appointment_date' => ['Jadwal survei aktif Anda untuk motor ini sudah ada.']]
            );
        }

        $inquiry = Inquiry::create([
            'motorcycle_id' => $motorcycle->id,
            'buyer_id' => $user->id,
            'appointment_date' => $validated['appointment_date'],
            'offered_price' => $validated['offered_price'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => InquiryStatus::Pending->value,
        ]);

        // Kirim event & notifikasi ke penjual
        event(new InquiryCreated($inquiry));

        if ($seller = $motorcycle->seller) {
            $seller->notify(new NewInquiryNotification($inquiry));
        }

        $inquiry->load(['motorcycle.motorcycleModel', 'motorcycle.seller', 'buyer']);

        return $this->createdResponse(
            data: new InquiryResource($inquiry),
            message: 'Jadwal survei fisik berhasil diajukan kepada penjual.'
        );
    }

    /**
     * Penjual menerima/menolak/menyelesaikan jadwal survei.
     */
    public function updateStatus(UpdateInquiryStatusRequest $request, int $id): JsonResponse
    {
        $inquiry = Inquiry::with('motorcycle')->findOrFail($id);
        $user = $request->user();

        // Hanya penjual (pemilik motor) atau admin yang boleh merespons inquiry
        if ($inquiry->motorcycle->user_id !== $user->id && ! $user->hasRole('admin')) {
            return $this->errorResponse(
                message: 'Hanya penjual pemilik motor atau admin yang berhak merespons status survei.',
                statusCode: Response::HTTP_FORBIDDEN
            );
        }

        $statusStr = $request->validated()['status'];
        $oldStatus = $inquiry->status;
        $newStatus = InquiryStatus::from($statusStr);

        $inquiry->status = $newStatus;
        $inquiry->seller_response_at = now();
        $inquiry->save();

        // Sinkronkan status listing motor jika survei diterima / selesai
        if ($newStatus === InquiryStatus::Accepted) {
            $inquiry->motorcycle->update(['status' => ListingStatus::Booked->value]);
        } elseif ($newStatus === InquiryStatus::Completed) {
            $inquiry->motorcycle->update(['status' => ListingStatus::Sold->value]);
        } elseif ($newStatus === InquiryStatus::Rejected && $inquiry->motorcycle->status === ListingStatus::Booked) {
            $inquiry->motorcycle->update(['status' => ListingStatus::Available->value]);
        }

        // Trigger event & notifikasi ke pembeli
        event(new InquiryStatusUpdated($inquiry, $oldStatus, $newStatus, 'seller'));
        $inquiry->buyer?->notify(new InquiryStatusUpdatedNotification($inquiry, 'seller'));

        $inquiry->load(['motorcycle.motorcycleModel', 'motorcycle.seller', 'buyer']);

        return $this->successResponse(
            data: new InquiryResource($inquiry),
            message: "Status survei berhasil diperbarui menjadi {$newStatus->value}."
        );
    }

    /**
     * Calon pembeli membatalkan pengajuan survei fisik miliknya.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $inquiry = Inquiry::with('motorcycle')->findOrFail($id);
        $user = $request->user();

        // Hanya pembeli atau admin yang dapat membatalkan booking
        if ($inquiry->buyer_id !== $user->id && ! $user->hasRole('admin')) {
            return $this->errorResponse(
                message: 'Anda tidak memiliki hak akses untuk membatalkan booking ini.',
                statusCode: Response::HTTP_FORBIDDEN
            );
        }

        if (inquiryStatusCompletedOrCancelled($inquiry->status)) {
            return $this->errorResponse(
                message: 'Survei fisik ini sudah selesai atau telah dibatalkan sebelumnya.',
                statusCode: Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $oldStatus = $inquiry->status;
        $inquiry->status = InquiryStatus::Cancelled;
        $inquiry->save();

        // Jika motor sebelumnya berstatus booked karena inquiry ini, kembalikan ke available
        if ($inquiry->motorcycle->status === ListingStatus::Booked) {
            $inquiry->motorcycle->update(['status' => ListingStatus::Available->value]);
        }

        // Trigger event & notifikasi ke penjual
        event(new InquiryStatusUpdated($inquiry, $oldStatus, InquiryStatus::Cancelled, 'buyer'));
        $inquiry->motorcycle?->seller?->notify(new InquiryStatusUpdatedNotification($inquiry, 'buyer'));

        $inquiry->load(['motorcycle.motorcycleModel', 'motorcycle.seller', 'buyer']);

        return $this->successResponse(
            data: new InquiryResource($inquiry),
            message: 'Jadwal survei fisik berhasil dibatalkan.'
        );
    }
}

function inquiryStatusCompletedOrCancelled(InquiryStatus|string $status): bool
{
    $val = $status instanceof InquiryStatus ? $status->value : $status;

    return in_array($val, ['completed', 'cancelled', 'rejected'], true);
}
