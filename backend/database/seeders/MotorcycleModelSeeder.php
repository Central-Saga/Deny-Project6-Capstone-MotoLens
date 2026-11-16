<?php

namespace Database\Seeders;

use App\Models\MotorcycleModel;
use Illuminate\Database\Seeder;

/**
 * Referensi model motor populer di Indonesia.
 *
 * PENTING (PRD Bab 16 V-06): `standard_price` adalah angka referensi ILUSTRATIF untuk demo
 * (perkiraan kasar harga unit baru/standar), BUKAN data pasar yang tervalidasi. Admin dapat
 * mengubahnya dan perubahan tercatat di activity log. Sumber dan tanggal dicatat per baris.
 */
class MotorcycleModelSeeder extends Seeder
{
    public const PRICE_SOURCE = 'Estimasi referensi demo MotoLens (belum divalidasi terhadap data pasar)';

    public const PRICE_REFERENCE_DATE = '2026-01-01';

    /** @return list<array{0:string,1:string,2:int,3:string,4:int}> brand, model, cc, category, harga */
    public static function rows(): array
    {
        return [
            ['Honda', 'Beat', 110, 'matic', 18_500_000],
            ['Honda', 'Scoopy', 110, 'matic', 22_500_000],
            ['Honda', 'Genio', 110, 'matic', 20_000_000],
            ['Honda', 'Vario 125', 125, 'matic', 24_500_000],
            ['Honda', 'Vario 160', 160, 'matic', 28_500_000],
            ['Honda', 'PCX 160', 160, 'matic', 33_500_000],
            ['Honda', 'ADV 160', 160, 'matic', 37_500_000],
            ['Honda', 'Revo', 110, 'bebek', 17_500_000],
            ['Honda', 'Supra X 125', 125, 'bebek', 20_500_000],
            ['Honda', 'CB150R Streetfire', 150, 'sport', 30_500_000],
            ['Honda', 'CBR150R', 150, 'sport', 37_000_000],
            ['Yamaha', 'Mio M3', 125, 'matic', 18_500_000],
            ['Yamaha', 'Fazzio', 125, 'matic', 23_500_000],
            ['Yamaha', 'Lexi', 125, 'matic', 24_500_000],
            ['Yamaha', 'Aerox 155', 155, 'matic', 30_500_000],
            ['Yamaha', 'NMAX 155', 155, 'matic', 34_500_000],
            ['Yamaha', 'Jupiter Z1', 115, 'bebek', 19_500_000],
            ['Yamaha', 'MT-15', 155, 'sport', 38_500_000],
            ['Yamaha', 'R15 V4', 155, 'sport', 42_000_000],
            ['Yamaha', 'XSR 155', 155, 'klasik', 39_500_000],
            ['Suzuki', 'Address', 125, 'matic', 19_500_000],
            ['Suzuki', 'Satria F150', 150, 'bebek', 26_500_000],
            ['Suzuki', 'GSX-R150', 150, 'sport', 34_500_000],
            ['Kawasaki', 'W175', 177, 'klasik', 33_500_000],
            ['Kawasaki', 'Ninja 250', 249, 'sport', 69_500_000],
        ];
    }

    public function run(): void
    {
        foreach (self::rows() as [$brand, $name, $cc, $category, $price]) {
            MotorcycleModel::updateOrCreate(
                ['brand' => $brand, 'model_name' => $name, 'engine_cc' => $cc],
                [
                    'category' => $category,
                    'standard_price' => $price,
                    'price_source' => self::PRICE_SOURCE,
                    'price_reference_date' => self::PRICE_REFERENCE_DATE,
                    'is_active' => true,
                ],
            );
        }
    }
}

