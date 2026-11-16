<?php

namespace App\Notifications;

use App\Enums\ModerationStatus;
use App\Models\Motorcycle;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MotorcycleModerationNotification extends Notification
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
        $isApproved = $this->status === ModerationStatus::Approved;

        return [
            'motorcycle_id' => $this->motorcycle->id,
            'motorcycle_title' => $this->motorcycle->title,
            'status' => $this->status->value,
            'reason' => $this->reason,
            'type' => 'motorcycle_moderation',
            'title' => $isApproved ? 'Iklan Motor Disetujui' : 'Iklan Motor Ditolak',
            'message' => $isApproved
                ? "Listing motor \"{$this->motorcycle->title}\" telah disetujui admin dan kini tayang di marketplace."
                : "Listing motor \"{$this->motorcycle->title}\" ditolak admin. Alasan: ".($this->reason ?? 'Tidak memenuhi syarat publikasi.'),
        ];
    }
}
