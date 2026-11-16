<?php

namespace App\Services;

use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Models\Inquiry;
use App\Models\Motorcycle;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class InquiryService
{
    /**
     * Mengajukan booking survei fisik / cek unit motor.
     * PRD v2.0.1 (Bab 2.3, 6.5, 7 Fase 2, 10.2).
     */
    public function createInquiry(
        int $buyerId,
        int $motorcycleId,
        Carbon|string $appointmentDate,
        ?int $offeredPrice = null,
        ?string $notes = null
    ): Inquiry {
        $motorcycle = Motorcycle::findOrFail($motorcycleId);

        // Aturan 1: Pembeli tidak boleh membukukan motor miliknya sendiri
        if ($motorcycle->user_id === $buyerId) {
            throw ValidationException::withMessages([
                'motorcycle_id' => ['Anda tidak dapat mengajukan booking pada motor milik Anda sendiri.'],
            ]);
        }

        // Aturan 2: Listing harus berstatus available dan approved
        if ($motorcycle->moderation_status !== ModerationStatus::Approved) {
            throw ValidationException::withMessages([
                'motorcycle_id' => ['Motor belum disetujui untuk ditampilkan di katalog.'],
            ]);
        }

        if ($motorcycle->status !== ListingStatus::Available) {
            throw ValidationException::withMessages([
                'motorcycle_id' => ['Motor saat ini tidak tersedia untuk booking (status: ' . $motorcycle->status->value . ').'],
            ]);
        }

        $parsedDate = $appointmentDate instanceof Carbon ? $appointmentDate : Carbon::parse($appointmentDate);

        // Tanggal booking tidak boleh di masa lalu
        if ($parsedDate->isPast()) {
            throw ValidationException::withMessages([
                'appointment_date' => ['Jadwal survei tidak boleh berada di waktu yang sudah lewat.'],
            ]);
        }

        // Aturan 3: Mencegah tabrakan jadwal survei aktif (rentang 1 jam)
        $startWindow = $parsedDate->copy()->subHour();
        $endWindow = $parsedDate->copy()->addHour();

        $hasCollision = Inquiry::where('motorcycle_id', $motorcycleId)
            ->whereIn('status', Inquiry::ACTIVE_STATUSES)
            ->whereBetween('appointment_date', [$startWindow, $endWindow])
            ->exists();

        if ($hasCollision) {
            throw ValidationException::withMessages([
                'appointment_date' => ['Jadwal survei pada rentang waktu ini sudah terisi oleh calon pembeli lain.'],
            ]);
        }

        $inquiry = Inquiry::create([
            'motorcycle_id' => $motorcycleId,
            'buyer_id' => $buyerId,
            'appointment_date' => $parsedDate,
            'offered_price' => $offeredPrice,
            'notes' => $notes,
            'status' => InquiryStatus::Pending,
        ]);

        activity('inquiry')
            ->performedOn($inquiry)
            ->causedBy($buyerId)
            ->withProperties([
                'motorcycle_id' => $motorcycleId,
                'appointment_date' => $parsedDate->toIso8601String(),
                'offered_price' => $offeredPrice,
            ])
            ->log('Pengajuan survei motor baru dibuat.');

        return $inquiry;
    }

    /**
     * Memperbarui status booking oleh penjual (Accept / Reject / Complete).
     */
    public function respondInquiry(
        Inquiry $inquiry,
        InquiryStatus|string $status,
        int $responderId
    ): Inquiry {
        $statusEnum = $status instanceof InquiryStatus ? $status : InquiryStatus::from($status);
        $motorcycle = $inquiry->motorcycle;

        $inquiry->update([
            'status' => $statusEnum,
            'seller_response_at' => now(),
        ]);

        // Sinkronisasi status listing motor
        if ($statusEnum === InquiryStatus::Accepted) {
            $motorcycle->update(['status' => ListingStatus::Booked]);
        } elseif ($statusEnum === InquiryStatus::Completed) {
            $motorcycle->update(['status' => ListingStatus::Sold]);
        } elseif (in_array($statusEnum, [InquiryStatus::Rejected, InquiryStatus::Cancelled], true)) {
            // Periksa apakah masih ada inquiry lain yang accepted
            $hasOtherAccepted = Inquiry::where('motorcycle_id', $motorcycle->id)
                ->where('status', InquiryStatus::Accepted)
                ->where('id', '!=', $inquiry->id)
                ->exists();

            if (! $hasOtherAccepted && $motorcycle->status === ListingStatus::Booked) {
                $motorcycle->update(['status' => ListingStatus::Available]);
            }
        }

        activity('inquiry')
            ->performedOn($inquiry)
            ->causedBy($responderId)
            ->withProperties([
                'new_status' => $statusEnum->value,
                'motorcycle_id' => $motorcycle->id,
            ])
            ->log("Status survei diubah menjadi: {$statusEnum->value}");

        return $inquiry;
    }

    /**
     * Membatalkan booking survei oleh pembeli atau penjual.
     */
    public function cancelInquiry(Inquiry $inquiry, int $userId, ?string $reason = null): Inquiry
    {
        if (in_array($inquiry->status, [InquiryStatus::Completed, InquiryStatus::Cancelled], true)) {
            throw ValidationException::withMessages([
                'status' => ['Survei yang sudah selesai atau dibatalkan tidak dapat dibatalkan lagi.'],
            ]);
        }

        return $this->respondInquiry($inquiry, InquiryStatus::Cancelled, $userId);
    }
}

