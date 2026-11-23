<?php

namespace App\Models;

use App\Enums\ReportStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'motorcycle_id',
        'reporter_id',
        'reason',
        'description',
        'status',
        'reviewed_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReportStatus::class,
        ];
    }

    public function motorcycle(): BelongsTo
    {
        return $this->belongsTo(Motorcycle::class)->withTrashed();
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', ReportStatus::Open->value);
    }
}
