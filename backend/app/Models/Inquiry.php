<?php

namespace App\Models;

use App\Enums\InquiryStatus;
use App\Http\Controllers\Api\V1\AdminController;
use Database\Factories\InquiryFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Inquiry extends Model
{
    /** @use HasFactory<InquiryFactory> */
    use HasFactory, LogsActivity;

    protected $fillable = [
        'motorcycle_id',
        'buyer_id',
        'appointment_date',
        'offered_price',
        'notes',
        'status',
        'seller_response_at',
    ];

    /** Status inquiry yang dianggap aktif (menahan jadwal/booking). */
    public const ACTIVE_STATUSES = [InquiryStatus::Pending, InquiryStatus::Accepted];

    protected static function booted(): void
    {
        static::saved(function (): void {
            AdminController::invalidateDashboardCache();
        });

        static::deleted(function (): void {
            AdminController::invalidateDashboardCache();
        });
    }

    protected function casts(): array
    {
        return [
            'appointment_date' => 'datetime',
            'offered_price' => 'integer',
            'status' => InquiryStatus::class,
            'seller_response_at' => 'datetime',
        ];
    }

    public function motorcycle(): BelongsTo
    {
        return $this->belongsTo(Motorcycle::class)->withTrashed();
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /** Penjual = pemilik listing. */
    public function seller(): HasOneThrough
    {
        return $this->hasOneThrough(User::class, Motorcycle::class, 'id', 'id', 'motorcycle_id', 'user_id');
    }

    public function scopeWithStatus(Builder $query, InquiryStatus|string $status): Builder
    {
        return $query->where('status', $status instanceof InquiryStatus ? $status->value : $status);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', array_map(fn (InquiryStatus $s) => $s->value, self::ACTIVE_STATUSES));
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('appointment_date', '>=', now());
    }

    public function scopeForBuyer(Builder $query, User|int $user): Builder
    {
        return $query->where('buyer_id', $user instanceof User ? $user->getKey() : $user);
    }

    public function scopeForSeller(Builder $query, User|int $user): Builder
    {
        $id = $user instanceof User ? $user->getKey() : $user;

        return $query->whereHas('motorcycle', fn (Builder $q) => $q->where('user_id', $id));
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('inquiry')
            ->logOnly(['status', 'appointment_date', 'offered_price'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
