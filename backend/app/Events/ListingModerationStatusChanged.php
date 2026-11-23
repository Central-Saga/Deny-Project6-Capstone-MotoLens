<?php

namespace App\Events;

use App\Enums\ModerationStatus;
use App\Models\Motorcycle;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ListingModerationStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Motorcycle $motorcycle,
        public ModerationStatus $oldStatus,
        public ModerationStatus $newStatus,
        public ?string $rejectionReason = null
    ) {}
}
