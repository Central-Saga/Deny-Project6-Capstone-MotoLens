<?php

namespace App\Notifications;

use App\Models\Inquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InquiryReceivedNotification extends Notification
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
        return [
            'inquiry_id' => $this->inquiry->id,
            'motorcycle_id' => $this->inquiry->motorcycle_id,
            'buyer_id' => $this->inquiry->buyer_id,
            'appointment_date' => $this->inquiry->appointment_date?->toISOString(),
            'message' => 'Anda menerima pengajuan jadwal survei fisik baru untuk motor Anda.',
        ];
    }
}
