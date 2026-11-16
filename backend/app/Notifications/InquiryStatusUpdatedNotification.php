<?php

namespace App\Notifications;

use App\Enums\InquiryStatus;
use App\Models\Inquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class InquiryStatusUpdatedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Inquiry $inquiry,
        public string $actorRole = 'seller',
        public ?string $customMessage = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $statusStr = $this->inquiry->status instanceof \BackedEnum
            ? $this->inquiry->status->value
            : (string) $this->inquiry->status;
        $motorcycleTitle = $this->inquiry->motorcycle?->title ?? 'unit motor';

        $defaultMessage = match ($statusStr) {
            'accepted' => "Penjual telah menerima jadwal survei fisik untuk {$motorcycleTitle}.",
            'rejected' => "Penjual menolak pengajuan jadwal survei fisik untuk {$motorcycleTitle}.",
            'completed' => "Survei fisik untuk {$motorcycleTitle} telah diselesaikan.",
            'cancelled' => "Calon pembeli membatalkan jadwal survei fisik untuk {$motorcycleTitle}.",
            default => "Status jadwal survei fisik untuk {$motorcycleTitle} diperbarui menjadi {$statusStr}.",
        };

        return [
            'inquiry_id' => $this->inquiry->id,
            'motorcycle_id' => $this->inquiry->motorcycle_id,
            'motorcycle_title' => $motorcycleTitle,
            'status' => $statusStr,
            'type' => 'inquiry_status_updated',
            'title' => 'Pembaruan Status Survei Fisik',
            'message' => $this->customMessage ?? $defaultMessage,
        ];
    }
}
