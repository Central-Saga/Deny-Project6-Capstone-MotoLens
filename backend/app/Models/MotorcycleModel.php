<?php

namespace App\Models;

use App\Enums\MotorcycleCategory;
use Database\Factories\MotorcycleModelFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Referensi model motor + harga standar. Perubahan `standard_price` dicatat
 * di activity log agar perubahan harga referensi dapat ditelusuri (PRD Bab 13.5).
 */
class MotorcycleModel extends Model
{
    /** @use HasFactory<MotorcycleModelFactory> */
    use HasFactory, LogsActivity;

    protected $table = 'motorcycle_models';

    protected $fillable = [
        'brand',
        'model_name',
        'engine_cc',
        'category',
        'standard_price',
        'price_source',
        'price_reference_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'engine_cc' => 'integer',
            'category' => MotorcycleCategory::class,
            'standard_price' => 'integer',
            'price_reference_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function motorcycles(): HasMany
    {
        return $this->hasMany(Motorcycle::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOfBrand(Builder $query, string $brand): Builder
    {
        return $query->where('brand', $brand);
    }

    public function scopeOfCategory(Builder $query, MotorcycleCategory|string $category): Builder
    {
        return $query->where('category', $category instanceof MotorcycleCategory ? $category->value : $category);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('motorcycle_model')
            ->logOnly(['brand', 'model_name', 'engine_cc', 'category', 'standard_price', 'price_source', 'price_reference_date', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->brand} {$this->model_name}";
    }
}
