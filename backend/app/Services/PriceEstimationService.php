<?php

namespace App\Services;

use App\Enums\ConditionGrade;
use App\Enums\DamageClass;
use App\Enums\PriceLabel;
use App\Enums\TaxStatus;
use InvalidArgumentException;

/**
 * Kalkulator estimasi harga berbasis aturan (PRD Bab 4.3-4.8).
 *
 * Satu-satunya implementasi rumus harga. Seeder, factory, dan (Fase 2+) API memakai kelas ini.
 * Semua parameter dibaca dari config/motolens.php. Nominal dihitung memakai integer
 * (rasio dikonversi ke basis poin) sehingga tidak ada floating point pada nominal Rupiah.
 *
 * Catatan fase: pada Fase 1 kelas ini hanya dibutuhkan agar data seed konsisten dengan rumus.
 * Validasi input lanjutan, integrasi ke alur inspeksi, dan test nilai batas lengkap
 * dilanjutkan pada Fase 2.
 */
class PriceEstimationService
{
    private const BP = 10000; // 1 = 10.000 basis poin

    /**
     * @param  array<string,int>|array<int,int>  $detectionCounts  kunci: nama kelas (Scratch/Dent/Accident)
     * @return array<string,mixed> breakdown (PRD Bab 4.8)
     */
    public function calculate(
        int $standardPrice,
        int $vehicleYear,
        int $odometerKm,
        TaxStatus|string $taxStatus,
        array $detectionCounts = [],
        ?int $sellerPrice = null,
        ?int $referenceYear = null,
    ): array {
        $taxStatus = $taxStatus instanceof TaxStatus ? $taxStatus : TaxStatus::from($taxStatus);
        $cfg = config('motolens.pricing');
        $currentYear = $referenceYear
            ?? (isset($cfg['reference_year']) ? (int) $cfg['reference_year'] : (int) now()->year);

        $this->assertValid($standardPrice, $vehicleYear, $odometerKm, $currentYear, $sellerPrice);

        // --- 4.3 Harga dasar terdepresiasi
        $age = max(0, $currentYear - $vehicleYear);
        $ageBp = min(
            $this->bp($cfg['age_depreciation_max']),
            $age * $this->bp($cfg['age_depreciation_per_year'])
        );
        $excessKm = max(0, $odometerKm - ($age * (int) $cfg['normal_km_per_year']));
        $odometerPenalty = $excessKm * (int) $cfg['excess_km_penalty_per_km'];
        $taxPenalty = $taxStatus === TaxStatus::Expired ? (int) $cfg['expired_tax_penalty'] : 0;

        $afterAge = $this->roundDiv($standardPrice * (self::BP - $ageBp), self::BP);
        $floorPrice = $this->roundDiv($standardPrice * $this->bp($cfg['min_price_ratio']), self::BP);
        $basePrice = max($floorPrice, $afterAge - $odometerPenalty - $taxPenalty);

        // --- 4.4 Penalti visual (basis poin)
        $counts = $this->normalizeCounts($detectionCounts);
        $perClass = [];
        $visualBp = 0;
        foreach (DamageClass::cases() as $class) {
            $rule = $cfg['visual_penalty'][$class->value];
            $classBp = min(
                $this->bp($rule['max']),
                $counts[$class->value] * $this->bp($rule['per_detection'])
            );
            $perClass[$class->value] = $classBp;
            $visualBp += $classBp;
        }
        $visualBp = min($this->bp($cfg['visual_penalty_total_max']), $visualBp);

        // --- 4.5 Estimasi setelah penalti visual, dibulatkan ke puluhan ribu
        $unit = (int) $cfg['rounding_unit'];
        $estimated = $this->roundDiv($basePrice * (self::BP - $visualBp), self::BP * $unit) * $unit;

        $totalDetections = array_sum($counts);

        return [
            'reference_year' => $currentYear,
            'standard_price' => $standardPrice,
            'vehicle_year' => $vehicleYear,
            'vehicle_age_years' => $age,
            'odometer_km' => $odometerKm,
            'tax_status' => $taxStatus->value,
            'age_depreciation_percent' => round($ageBp / 100, 2),
            'age_depreciation_amount' => $standardPrice - $afterAge,
            'excess_km' => $excessKm,
            'odometer_penalty' => $odometerPenalty,
            'tax_penalty' => $taxPenalty,
            'minimum_price_floor' => $floorPrice,
            'base_depreciated_price' => $basePrice,
            'detection_counts' => $counts,
            'total_detections' => $totalDetections,
            'visual_penalty_per_class_percent' => array_map(fn ($v) => round($v / 100, 2), $perClass),
            'visual_penalty_percent' => round($visualBp / 100, 2),
            'estimated_price' => $estimated,
            'seller_price' => $sellerPrice,
            'price_label' => $sellerPrice !== null ? $this->labelFor($sellerPrice, $estimated)?->value : null,
            'condition_grade' => $this->gradeFor($totalDetections, $visualBp)->value,
            'parameters' => [
                'age_depreciation_per_year' => $cfg['age_depreciation_per_year'],
                'age_depreciation_max' => $cfg['age_depreciation_max'],
                'min_price_ratio' => $cfg['min_price_ratio'],
                'normal_km_per_year' => $cfg['normal_km_per_year'],
                'excess_km_penalty_per_km' => $cfg['excess_km_penalty_per_km'],
                'expired_tax_penalty' => $cfg['expired_tax_penalty'],
                'rounding_unit' => $unit,
                'visual_penalty' => $cfg['visual_penalty'],
                'visual_penalty_total_max' => $cfg['visual_penalty_total_max'],
                'label_lower_ratio' => $cfg['label_lower_ratio'],
                'label_upper_ratio' => $cfg['label_upper_ratio'],
            ],
        ];
    }

    /** PRD Bab 4.6. Null jika harga penjual belum ada (jangan mengklasifikasikan). */
    public function labelFor(?int $sellerPrice, int $estimatedPrice): ?PriceLabel
    {
        if ($sellerPrice === null) {
            return null;
        }
        $lower = $this->bp(config('motolens.pricing.label_lower_ratio'));
        $upper = $this->bp(config('motolens.pricing.label_upper_ratio'));

        // Perbandingan integer: seller*BP vs estimated*ratioBp.
        if ($sellerPrice * self::BP < $estimatedPrice * $lower) {
            return PriceLabel::GoodDeal;
        }
        if ($sellerPrice * self::BP > $estimatedPrice * $upper) {
            return PriceLabel::Overpriced;
        }

        return PriceLabel::FairPrice;
    }

    /** PRD Bab 4.7. Grade visual, bukan kondisi mesin/rangka. */
    public function gradeFor(int $totalDetections, int $visualPenaltyBp): ConditionGrade
    {
        if ($totalDetections === 0) {
            return ConditionGrade::Mulus;
        }
        if ($visualPenaltyBp <= $this->bp(config('motolens.pricing.grade_light_max_penalty'))) {
            return ConditionGrade::LecetRingan;
        }

        return ConditionGrade::PerluPerbaikan;
    }

    private function assertValid(int $standardPrice, int $vehicleYear, int $odometerKm, int $currentYear, ?int $sellerPrice): void
    {
        if ($standardPrice <= 0) {
            throw new InvalidArgumentException('standard_price harus lebih besar dari nol.');
        }
        if ($vehicleYear > $currentYear) {
            throw new InvalidArgumentException('year tidak boleh melebihi tahun berjalan.');
        }
        if ($odometerKm < 0) {
            throw new InvalidArgumentException('odometer_km tidak boleh negatif.');
        }
        if ($sellerPrice !== null && $sellerPrice <= 0) {
            throw new InvalidArgumentException('seller_price harus lebih besar dari nol.');
        }
    }

    /** @return array<string,int> */
    private function normalizeCounts(array $counts): array
    {
        $out = [];
        foreach (DamageClass::cases() as $class) {
            $n = (int) ($counts[$class->value] ?? $counts[$class->countColumn()] ?? 0);
            if ($n < 0) {
                throw new InvalidArgumentException("Jumlah deteksi {$class->value} tidak boleh negatif.");
            }
            $out[$class->value] = $n;
        }

        return $out;
    }

    /** Rasio desimal (mis. 0.025) -> basis poin integer (250). */
    private function bp(float|int $ratio): int
    {
        return (int) round($ratio * self::BP);
    }

    /** Pembagian integer dengan pembulatan half-up (nilai non-negatif). */
    private function roundDiv(int $numerator, int $denominator): int
    {
        return intdiv($numerator + intdiv($denominator, 2), $denominator);
    }
}
