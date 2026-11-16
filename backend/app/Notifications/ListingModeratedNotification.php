<?php

namespace App\Notifications;

use App\Enums\ModerationStatus;
use App\Models\Motorcycle;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ListingModeratedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Motorcycle $motorcycle,
        public ModerationStatus $status,
        public ?string $reason = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'motorcycle_id' => $this->motorcycle->id,
            'title' => $this->motorcycle->title,
            'status' => $this->status->value,
            'reason' => $this->reason,
            'message' => $this->status === ModerationStatus::Approved
                ? 'Listing motor Anda telah disetujui dan kini tayang di marketplace.'
                : 'Listing motor Anda ditolak oleh admin. Alasan: '.($this->reason ?? 'Tidak memenuhi syarat.'),
        ];
    }
}
