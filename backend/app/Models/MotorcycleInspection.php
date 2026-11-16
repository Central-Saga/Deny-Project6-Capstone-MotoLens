<?php

namespace App\Models;

use App\Enums\InspectionStatus;
use App\Enums\SourceType;
use App\Enums\VerificationStatus;
use Database\Factories\MotorcycleInspectionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * Riwayat inspeksi (PRD Bab 5.5). Tidak memakai soft delete & tidak ditimpa:
 * inspeksi baru = baris baru. Hasil gagal BUKAN inspeksi dengan nol kerusakan;
 * bedakan lewat `inspection_status`.
 */
class MotorcycleInspection extends Model implements HasMedia
{
    /** @use HasFactory<MotorcycleInspectionFactory> */
    use HasFactory, InteractsWithMedia, LogsActivity;

    public const MEDIA_RAW_PHOTO = 'raw_photo';

    public const MEDIA_ANNOTATED_PHOTO = 'annotated_photo';

    protected $table = 'motorcycle_inspections';

    protected $fillable = [
        'motorcycle_id',
        'user_id',
        'model_name',
        'model_version',
        'model_sha256',
        'confidence_threshold',
        'nms_iou_threshold',
        'source_type',
        'inspection_status',
        'raw_photo_media_id',
        'annotated_photo_media_id',
        'image_width',
        'image_height',
        'scratch_count',
        'dent_count',
        'accident_count',
        'average_confidence',
        'total_damages_detected',
        'detections_json',
        'inference_time_ms',
        'base_depreciated_price',
        'ml_predicted_price',
        'damage_penalty_percent',
        'price_calculation_snapshot',
        'latitude',
        'longitude',
        'location_accuracy_m',
        'captured_at',
        'verification_status',
        'error_code',
        'error_message_safe',
    ];

    protected function casts(): array
    {
        return [
            'confidence_threshold' => 'decimal:3',
            'nms_iou_threshold' => 'decimal:3',
            'source_type' => SourceType::class,
            'inspection_status' => InspectionStatus::class,
            'image_width' => 'integer',
            'image_height' => 'integer',
            'scratch_count' => 'integer',
            'dent_count' => 'integer',
            'accident_count' => 'integer',
            'average_confidence' => 'decimal:4',
            'total_damages_detected' => 'integer',
            'detections_json' => 'array',
            'inference_time_ms' => 'integer',
            'base_depreciated_price' => 'integer',
            'ml_predicted_price' => 'integer',
            'damage_penalty_percent' => 'decimal:2',
            'price_calculation_snapshot' => 'array',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'location_accuracy_m' => 'decimal:2',
            'captured_at' => 'datetime',
            'verification_status' => VerificationStatus::class,
        ];
    }

    // ---- Relasi

    public function motorcycle(): BelongsTo
    {
        return $this->belongsTo(Motorcycle::class)->withTrashed();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(InspectionFeedback::class, 'inspection_id');
    }

    // ---- Scopes

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('inspection_status', InspectionStatus::Completed->value);
    }

    public function scopeFromSource(Builder $query, SourceType|string $source): Builder
    {
        return $query->where('source_type', $source instanceof SourceType ? $source->value : $source);
    }

    /** Data demo hasil seeder (bukan inferensi nyata). */
    public function scopeSeedDemo(Builder $query): Builder
    {
        return $query->fromSource(SourceType::SeedDemo);
    }

    /** Hasil dari upload nyata (android_camera / web_upload), bukan seeder. */
    public function scopeRealInference(Builder $query): Builder
    {
        return $query->where('source_type', '!=', SourceType::SeedDemo->value);
    }

    public function isSeedDemo(): bool
    {
        return $this->source_type === SourceType::SeedDemo;
    }

    // ---- Media

    public function registerMediaCollections(): void
    {
        $mimes = ['image/jpeg', 'image/png', 'image/webp'];

        $this->addMediaCollection(self::MEDIA_RAW_PHOTO)->singleFile()->acceptsMimeTypes($mimes);
        $this->addMediaCollection(self::MEDIA_ANNOTATED_PHOTO)->singleFile()->acceptsMimeTypes($mimes);
    }

    // ---- Activity log (tanpa koordinat/payload mentah)

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('inspection')
            ->logOnly(['inspection_status', 'source_type', 'verification_status', 'model_version', 'total_damages_detected'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}

