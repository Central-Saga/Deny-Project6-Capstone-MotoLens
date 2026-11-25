<?php

namespace App\Models;

use App\Enums\ConditionGrade;
use App\Enums\ListingStatus;
use App\Enums\ModerationStatus;
use App\Enums\PriceLabel;
use App\Enums\TaxStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Api\V1\AdminController;
use Database\Factories\MotorcycleFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Motorcycle extends Model implements HasMedia
{
    /** @use HasFactory<MotorcycleFactory> */
    use HasFactory, InteractsWithMedia, LogsActivity, SoftDeletes;

    /** Koleksi Spatie Media Library (PRD Bab 5.6). */
    public const MEDIA_MAIN_PHOTO = 'main_photo';

    public const MEDIA_ANGLE_PHOTOS = 'angle_photos';

    public const MEDIA_DAMAGE_DETAILS = 'damage_details';

    protected static function booted(): void
    {
        static::saved(function (): void {
            AdminController::invalidateDashboardCache();
        });

        static::deleted(function (): void {
            AdminController::invalidateDashboardCache();
        });
    }

    /**
     * Kolom hasil kalkulasi/inspeksi (base_depreciated_price, ml_predicted_price,
     * price_label, condition_grade, *_count, damage_penalty_percent, latest_inspection_id,
     * verification) sengaja di $fillable karena diisi service backend & seeder,
     * bukan dari payload klien langsung (Form Request akan membatasi pada Fase 2/3).
     */
    protected $fillable = [
        'user_id',
        'motorcycle_model_id',
        'title',
        'description',
        'year',
        'odometer_km',
        'tax_status',
        'location_address',
        'latitude',
        'longitude',
        'seller_price',
        'base_depreciated_price',
        'ml_predicted_price',
        'price_label',
        'condition_grade',
        'scratch_count',
        'dent_count',
        'accident_count',
        'damage_penalty_percent',
        'latest_inspection_id',
        'is_camera_verified',
        'verification_status',
        'status',
        'moderation_status',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'odometer_km' => 'integer',
            'tax_status' => TaxStatus::class,
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'seller_price' => 'integer',
            'base_depreciated_price' => 'integer',
            'ml_predicted_price' => 'integer',
            'price_label' => PriceLabel::class,
            'condition_grade' => ConditionGrade::class,
            'scratch_count' => 'integer',
            'dent_count' => 'integer',
            'accident_count' => 'integer',
            'damage_penalty_percent' => 'decimal:2',
            'is_camera_verified' => 'boolean',
            'verification_status' => VerificationStatus::class,
            'status' => ListingStatus::class,
            'moderation_status' => ModerationStatus::class,
        ];
    }

    // ---- Relasi

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Alias untuk seller (pemilik listing). */
    public function user(): BelongsTo
    {
        return $this->seller();
    }

    public function motorcycleModel(): BelongsTo
    {
        return $this->belongsTo(MotorcycleModel::class);
    }

    /** Alias untuk motorcycleModel agar konsisten dengan relasi singkat. */
    public function model(): BelongsTo
    {
        return $this->motorcycleModel();
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(MotorcycleInspection::class)->latest('id');
    }

    public function latestInspection(): BelongsTo
    {
        return $this->belongsTo(MotorcycleInspection::class, 'latest_inspection_id');
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class);
    }

    public function priceHistories(): HasMany
    {
        return $this->hasMany(MotorcyclePriceHistory::class)->latest('id');
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'motorcycle_favorites')->withTimestamps();
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    // ---- Scopes

    /** Listing yang boleh tampil di katalog publik: approved dan tidak diarsipkan (PRD Bab 10.4). */
    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->where('moderation_status', ModerationStatus::Approved->value);
    }

    public function scopeModeration(Builder $query, ModerationStatus|string $status): Builder
    {
        return $query->where('moderation_status', $status instanceof ModerationStatus ? $status->value : $status);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->moderation(ModerationStatus::Pending);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->moderation(ModerationStatus::Approved);
    }

    public function scopeWithStatus(Builder $query, ListingStatus|string $status): Builder
    {
        return $query->where('status', $status instanceof ListingStatus ? $status->value : $status);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->withStatus(ListingStatus::Available);
    }

    public function scopeOwnedBy(Builder $query, User|int $user): Builder
    {
        return $query->where('user_id', $user instanceof User ? $user->getKey() : $user);
    }

    public function scopeOfBrand(Builder $query, string $brand): Builder
    {
        return $query->whereHas('motorcycleModel', fn (Builder $q) => $q->where('brand', $brand));
    }

    public function scopeOfModelName(Builder $query, string $modelName): Builder
    {
        return $query->whereHas('motorcycleModel', fn (Builder $q) => $q->where('model_name', 'like', "%{$modelName}%"));
    }

    public function scopeOfYear(Builder $query, int $year): Builder
    {
        return $query->where('year', $year);
    }

    public function scopePriceBetween(Builder $query, ?int $min, ?int $max): Builder
    {
        return $query
            ->when($min !== null, fn (Builder $q) => $q->where('seller_price', '>=', $min))
            ->when($max !== null, fn (Builder $q) => $q->where('seller_price', '<=', $max));
    }

    public function scopeWithPriceLabel(Builder $query, PriceLabel|string $label): Builder
    {
        return $query->where('price_label', $label instanceof PriceLabel ? $label->value : $label);
    }

    public function scopeWithConditionGrade(Builder $query, ConditionGrade|string $grade): Builder
    {
        return $query->where('condition_grade', $grade instanceof ConditionGrade ? $grade->value : $grade);
    }

    public function scopeInLocation(Builder $query, string $location): Builder
    {
        return $query->whereRaw('LOWER(location_address) LIKE ?', ['%'.mb_strtolower($location).'%']);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if ($term === null || trim($term) === '') {
            return $query;
        }

        $like = '%'.mb_strtolower(trim($term)).'%';

        return $query->where(function (Builder $q) use ($like) {
            $q->whereRaw('LOWER(title) LIKE ?', [$like])
                ->orWhereRaw('LOWER(description) LIKE ?', [$like])
                ->orWhereHas('motorcycleModel', fn (Builder $m) => $m
                    ->whereRaw('LOWER(brand) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(model_name) LIKE ?', [$like]));
        });
    }

    /** sort = newest | price_asc | price_desc (PRD Bab 6.3). */
    public function scopeSortBy(Builder $query, ?string $sort): Builder
    {
        return match ($sort) {
            'price_asc' => $query->orderBy('seller_price')->orderByDesc('id'),
            'price_desc' => $query->orderByDesc('seller_price')->orderByDesc('id'),
            default => $query->orderByDesc('created_at')->orderByDesc('id'),
        };
    }

    // ---- Media (Spatie)

    public function registerMediaCollections(): void
    {
        $mimes = ['image/jpeg', 'image/png', 'image/webp'];

        $this->addMediaCollection(self::MEDIA_MAIN_PHOTO)->singleFile()->acceptsMimeTypes($mimes);
        // custom properties: angle (front|rear|left|right), order, inspection_id
        $this->addMediaCollection(self::MEDIA_ANGLE_PHOTOS)->acceptsMimeTypes($mimes);
        $this->addMediaCollection(self::MEDIA_DAMAGE_DETAILS)->acceptsMimeTypes($mimes);
    }

    // ---- Activity log (tanpa data sensitif; koordinat presisi tidak dicatat)

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('motorcycle')
            ->logOnly([
                'title', 'seller_price', 'price_label', 'condition_grade',
                'status', 'moderation_status', 'verification_status',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
