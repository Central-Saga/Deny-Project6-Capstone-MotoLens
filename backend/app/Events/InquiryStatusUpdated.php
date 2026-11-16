<?php

namespace App\Events;

use App\Enums\InquiryStatus;
use App\Models\Inquiry;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InquiryStatusUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Inquiry $inquiry,
        public InquiryStatus $oldStatus,
        public InquiryStatus $newStatus,
        public string $actorRole = 'seller'
    ) {
    }
}

