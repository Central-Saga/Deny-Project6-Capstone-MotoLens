<?php

namespace Database\Seeders\Support;

/**
 * Wilayah Bali untuk data demo (Denpasar, Badung, Gianyar, Tabanan, Buleleng).
 * Koordinat adalah pusat area perkiraan; BUKAN alamat presisi penjual (PRD Bab 11.3-11.4).
 */
final class BaliLocations
{
    /** @return list<array{regency:string,area:string,lat:float,lng:float}> */
    public static function all(): array
    {
        return [
            ['regency' => 'Denpasar', 'area' => 'Denpasar Barat', 'lat' => -8.6561, 'lng' => 115.2058],
            ['regency' => 'Denpasar', 'area' => 'Denpasar Selatan (Sanur)', 'lat' => -8.6905, 'lng' => 115.2630],
            ['regency' => 'Denpasar', 'area' => 'Denpasar Timur', 'lat' => -8.6571, 'lng' => 115.2438],
            ['regency' => 'Denpasar', 'area' => 'Denpasar Utara (Ubung)', 'lat' => -8.6296, 'lng' => 115.2118],
            ['regency' => 'Badung', 'area' => 'Kuta', 'lat' => -8.7222, 'lng' => 115.1717],
            ['regency' => 'Badung', 'area' => 'Mengwi', 'lat' => -8.5656, 'lng' => 115.1747],
            ['regency' => 'Badung', 'area' => 'Jimbaran', 'lat' => -8.7842, 'lng' => 115.1649],
            ['regency' => 'Badung', 'area' => 'Kuta Utara (Canggu)', 'lat' => -8.6478, 'lng' => 115.1385],
            ['regency' => 'Badung', 'area' => 'Abiansemal', 'lat' => -8.5476, 'lng' => 115.2278],
            ['regency' => 'Gianyar', 'area' => 'Ubud', 'lat' => -8.5069, 'lng' => 115.2625],
            ['regency' => 'Gianyar', 'area' => 'Sukawati', 'lat' => -8.5961, 'lng' => 115.2900],
            ['regency' => 'Gianyar', 'area' => 'Gianyar Kota', 'lat' => -8.5445, 'lng' => 115.3249],
            ['regency' => 'Gianyar', 'area' => 'Blahbatuh', 'lat' => -8.5847, 'lng' => 115.3398],
            ['regency' => 'Tabanan', 'area' => 'Tabanan Kota', 'lat' => -8.5387, 'lng' => 115.1250],
            ['regency' => 'Tabanan', 'area' => 'Kediri', 'lat' => -8.5787, 'lng' => 115.1066],
            ['regency' => 'Tabanan', 'area' => 'Penebel', 'lat' => -8.4437, 'lng' => 115.1349],
            ['regency' => 'Buleleng', 'area' => 'Singaraja', 'lat' => -8.1120, 'lng' => 115.0882],
            ['regency' => 'Buleleng', 'area' => 'Buleleng (Lovina)', 'lat' => -8.1604, 'lng' => 115.0236],
            ['regency' => 'Buleleng', 'area' => 'Seririt', 'lat' => -8.1980, 'lng' => 114.9360],
            ['regency' => 'Buleleng', 'area' => 'Sukasada', 'lat' => -8.1730, 'lng' => 115.0900],
        ];
    }

    /** Label umum untuk kolom location_address (area, bukan alamat presisi). */
    public static function address(array $location): string
    {
        return "{$location['area']}, {$location['regency']}, Bali";
    }
}

