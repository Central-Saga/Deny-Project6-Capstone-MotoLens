<?php

namespace Tests\Unit;

use App\Enums\ConditionGrade;
use App\Enums\PriceLabel;
use App\Services\PriceEstimationService;
use Carbon\Carbon;
use InvalidArgumentException;
use Tests\TestCase;

/**
 * Nilai batas rumus PRD Bab 4.3-4.7. Angka diverifikasi manual (lihat komentar).
 */
class PriceEstimationServiceTest extends TestCase
{
    private PriceEstimationService $svc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = new PriceEstimationService;
    }

    private function calc(array $override = []): array
    {
        $args = array_merge([
            'standardPrice' => 20_000_000,
            'vehicleYear' => 2022,
            'odometerKm' => 30_000,
            'taxStatus' => 'active',
            'detectionCounts' => [],
            'sellerPrice' => null,
            'referenceYear' => 2026,
        ], $override);

        return $this->svc->calculate(...$args);
    }

    public function test_base_price_with_age_depreciation_only(): void
    {
        // U=4 -> 24% ; 20.000.000 * 0.76 = 15.200.000 ; odometer 30.000 <= 40.000 -> tanpa penalti
        $r = $this->calc();

        $this->assertSame(4, $r['vehicle_age_years']);
        $this->assertSame(24.0, $r['age_depreciation_percent']);
        $this->assertSame(0, $r['odometer_penalty']);
        $this->assertSame(0, $r['tax_penalty']);
        $this->assertSame(15_200_000, $r['base_depreciated_price']);
        $this->assertSame(15_200_000, $r['estimated_price']);
        $this->assertNull($r['price_label'], 'Tanpa harga penjual, label harus null.');
        $this->assertSame(ConditionGrade::Mulus->value, $r['condition_grade']);
    }

    public function test_odometer_exactly_at_normal_usage_has_no_penalty_and_one_km_over_costs_rp50(): void
    {
        $this->assertSame(0, $this->calc(['odometerKm' => 40_000])['odometer_penalty']);

        $over = $this->calc(['odometerKm' => 40_001]);
        $this->assertSame(1, $over['excess_km']);
        $this->assertSame(50, $over['odometer_penalty']);
    }

    public function test_expired_tax_and_odometer_penalty_with_visual_penalty_and_half_up_rounding(): void
    {
        // base = 15.200.000 - (10.000 km x 50 = 500.000) - 750.000 = 13.950.000
        // Scratch 2 (5%) + Dent 1 (5%) = 10% -> 13.950.000 x 0.9 = 12.555.000 -> round(-4) half-up = 12.560.000
        $r = $this->calc([
            'odometerKm' => 50_000,
            'taxStatus' => 'expired',
            'detectionCounts' => ['Scratch' => 2, 'Dent' => 1],
        ]);

        $this->assertSame(13_950_000, $r['base_depreciated_price']);
        $this->assertSame(10.0, $r['visual_penalty_percent']);
        $this->assertSame(12_560_000, $r['estimated_price']);
        // D_visual tepat 0.10 -> masih lecet_ringan (batas inklusif)
        $this->assertSame(ConditionGrade::LecetRingan->value, $r['condition_grade']);
    }

    public function test_age_depreciation_is_capped_at_60_percent(): void
    {
        $r = $this->calc(['vehicleYear' => 2016, 'odometerKm' => 0]); // U=10 -> 60% tepat
        $this->assertSame(60.0, $r['age_depreciation_percent']);
        $this->assertSame(8_000_000, $r['base_depreciated_price']);

        $older = $this->calc(['vehicleYear' => 2000, 'odometerKm' => 0]); // U=26 -> tetap 60%
        $this->assertSame(60.0, $older['age_depreciation_percent']);
        $this->assertSame(8_000_000, $older['base_depreciated_price']);
    }

    public function test_base_price_never_below_30_percent_of_standard_price(): void
    {
        // 8.000.000 - (300.000-160.000)*50 = 8.000.000 - 7.000.000 = 1.000.000 -> lantai 6.000.000
        $r = $this->calc(['vehicleYear' => 2010, 'odometerKm' => 300_000]);
        $this->assertSame(6_000_000, $r['base_depreciated_price']);
    }

    public function test_vehicle_from_current_year_has_no_age_depreciation(): void
    {
        $r = $this->calc(['vehicleYear' => 2026, 'odometerKm' => 0]);
        $this->assertSame(0, $r['vehicle_age_years']);
        $this->assertSame(20_000_000, $r['base_depreciated_price']);
    }

    public function test_per_class_visual_caps_and_total_cap(): void
    {
        $scratch = $this->calc(['detectionCounts' => ['Scratch' => 4]]);
        $this->assertSame(10.0, $scratch['visual_penalty_percent']);
        $this->assertSame(10.0, $this->calc(['detectionCounts' => ['Scratch' => 40]])['visual_penalty_percent']);

        $this->assertSame(15.0, $this->calc(['detectionCounts' => ['Dent' => 3]])['visual_penalty_percent']);
        $this->assertSame(15.0, $this->calc(['detectionCounts' => ['Dent' => 30]])['visual_penalty_percent']);

        $this->assertSame(7.5, $this->calc(['detectionCounts' => ['Accident' => 1]])['visual_penalty_percent']);
        $this->assertSame(20.0, $this->calc(['detectionCounts' => ['Accident' => 50]])['visual_penalty_percent']);

        // 10 + 15 + 20 = 45% -> dibatasi 30%
        $all = $this->calc(['detectionCounts' => ['Scratch' => 9, 'Dent' => 9, 'Accident' => 9]]);
        $this->assertSame(30.0, $all['visual_penalty_percent']);
        $this->assertSame(ConditionGrade::PerluPerbaikan->value, $all['condition_grade']);
    }

    public function test_condition_grade_boundaries(): void
    {
        $this->assertSame('mulus', $this->calc()['condition_grade']);
        $this->assertSame('lecet_ringan', $this->calc(['detectionCounts' => ['Scratch' => 1]])['condition_grade']);
        $this->assertSame('lecet_ringan', $this->calc(['detectionCounts' => ['Accident' => 1]])['condition_grade']); // 7,5%
        $this->assertSame('perlu_perbaikan', $this->calc(['detectionCounts' => ['Scratch' => 1, 'Dent' => 2]])['condition_grade']); // 12,5%
        $this->assertSame('perlu_perbaikan', $this->calc(['detectionCounts' => ['Accident' => 2]])['condition_grade']); // 15%
    }

    public function test_price_label_boundaries_use_inclusive_fair_range(): void
    {
        // P_ml = 12.560.000 -> 0,95x = 11.932.000 ; 1,05x = 13.188.000
        $estimated = 12_560_000;

        $this->assertSame(PriceLabel::GoodDeal, $this->svc->labelFor(11_931_999, $estimated));
        $this->assertSame(PriceLabel::FairPrice, $this->svc->labelFor(11_932_000, $estimated));
        $this->assertSame(PriceLabel::FairPrice, $this->svc->labelFor(12_560_000, $estimated));
        $this->assertSame(PriceLabel::FairPrice, $this->svc->labelFor(13_188_000, $estimated));
        $this->assertSame(PriceLabel::Overpriced, $this->svc->labelFor(13_188_001, $estimated));
        $this->assertNull($this->svc->labelFor(null, $estimated));
    }

    public function test_breakdown_exposes_required_fields_and_label_when_seller_price_given(): void
    {
        $r = $this->calc(['sellerPrice' => 10_000_000]);

        foreach ([
            'standard_price', 'vehicle_age_years', 'age_depreciation_percent', 'odometer_penalty',
            'tax_penalty', 'base_depreciated_price', 'detection_counts', 'visual_penalty_percent',
            'estimated_price', 'seller_price', 'price_label', 'parameters',
        ] as $key) {
            $this->assertArrayHasKey($key, $r);
        }
        $this->assertSame('good_deal', $r['price_label']);
        $this->assertEquals(['Scratch' => 0, 'Dent' => 0, 'Accident' => 0], $r['detection_counts']);
    }

    public function test_reference_year_is_dynamic_from_server_date_not_hardcoded(): void
    {
        Carbon::setTestNow('2030-06-01');
        $r = $this->svc->calculate(20_000_000, 2026, 0, 'active');
        Carbon::setTestNow();

        $this->assertSame(2030, $r['reference_year']);
        $this->assertSame(4, $r['vehicle_age_years']);
    }

    public function test_parameters_come_from_config(): void
    {
        config(['motolens.pricing.expired_tax_penalty' => 1_000_000]);

        $this->assertSame(1_000_000, $this->calc(['taxStatus' => 'expired'])['tax_penalty']);
    }

    public function test_invalid_inputs_are_rejected(): void
    {
        foreach ([
            ['standardPrice' => 0],
            ['vehicleYear' => 2027],
            ['odometerKm' => -1],
            ['sellerPrice' => 0],
            ['detectionCounts' => ['Scratch' => -1]],
        ] as $override) {
            try {
                $this->calc($override);
                $this->fail('Seharusnya melempar InvalidArgumentException: '.json_encode($override));
            } catch (InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
    }
}
