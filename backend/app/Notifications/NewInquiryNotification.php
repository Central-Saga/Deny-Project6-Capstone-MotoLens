<?php

namespace App\Notifications;

use App\Models\Inquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewInquiryNotification extends Notification
{
    use Queueable;

    public function __construct(public Inquiry $inquiry)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $motorcycleTitle = $this->inquiry->motorcycle?->title ?? 'motor Anda';

        return [
            'inquiry_id' => $this->inquiry->id,
            'motorcycle_id' => $this->inquiry->motorcycle_id,
            'motorcycle_title' => $motorcycleTitle,
            'buyer_id' => $this->inquiry->buyer_id,
            'buyer_name' => $this->inquiry->buyer?->name,
            'appointment_date' => $this->inquiry->appointment_date?->toISOString(),
            'type' => 'new_inquiry',
            'title' => 'Pengajuan Survei Fisik Baru',
            'message' => "Anda menerima pengajuan jadwal survei fisik baru untuk {$motorcycleTitle}.",
        ];
    }
}
