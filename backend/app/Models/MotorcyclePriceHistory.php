<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MotorcyclePriceHistory extends Model
{
    use HasFactory;

    protected $table = 'motorcycle_price_histories';

    protected $fillable = [
        'motorcycle_id',
        'old_price',
        'new_price',
        'changed_by',
    ];

    protected function casts(): array
    {
        return [
            'old_price' => 'integer',
            'new_price' => 'integer',
        ];
    }

    public function motorcycle(): BelongsTo
    {
        return $this->belongsTo(Motorcycle::class)->withTrashed();
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}

