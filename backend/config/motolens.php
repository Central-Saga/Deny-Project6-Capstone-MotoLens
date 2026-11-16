<?php

/*
|--------------------------------------------------------------------------
| MotoLens — konfigurasi domain (PRD v2.0.1)
|--------------------------------------------------------------------------
| Semua parameter model ML dan rumus harga berada di sini (PRD Bab 3.4, 3.9, 4.3-4.7).
| Nilai rumus adalah ASUMSI AWAL dari PRD yang disetujui developer (V-05, V-07);
| BUKAN fakta pasar yang sudah divalidasi. Jangan menyebutnya sebagai klaim akurasi.
|
| Satuan: uang = integer Rupiah. Rasio diberikan sebagai pecahan desimal
| (0.06 = 6%) dan dikonversi ke basis poin integer oleh PriceEstimationService
| agar perhitungan nominal tidak memakai floating point.
*/

return [

    // Zona waktu: DB/aplikasi memakai UTC, tampilan memakai WITA (PRD Bab 5.1).
    'display_timezone' => env('MOTOLENS_DISPLAY_TIMEZONE', 'Asia/Makassar'),

    'ml' => [
        'model_name' => env('ML_MODEL_NAME', 'model_damage'),
        'model_version' => env('ML_MODEL_VERSION', 'optimized_v2'),

        // Lokasi artefak (PRD Bab 12.3: ML_MODEL_PATH, ML_PYTHON_BINARY).
        'model_path' => env('ML_MODEL_PATH', storage_path('app/ml/model_damage.onnx')),
        'python_binary' => env('ML_PYTHON_BINARY', 'python'),

        /*
         * SHA-256 artefak ONNX aktual model_damage.onnx (PRD Bab 3.3, 3.9 & 19.1).
         */
        'model_sha256' => env('ML_MODEL_SHA256', '22ec0d55bdb32939ae8ca5cd4bb1207ab8576f4775f8c5e32359ceb81ab49edd'),

        // Urutan indeks kelas sesuai metadata model (PRD Bab 3.2).
        'class_names' => ['Accident', 'Dent', 'Scratch'],

        'input_shape' => [1, 3, 640, 640],
        'output_shape' => [1, 7, 8400],

        // Default developer (V-04): 0.35 dan NMS IoU 0.45, dapat diubah via .env.
        'confidence_threshold' => (float) env('ML_CONFIDENCE_THRESHOLD', 0.35),
        'nms_iou_threshold' => (float) env('ML_NMS_IOU_THRESHOLD', 0.45),

        // Dicatat sebagai identitas model; detail akan diverifikasi pada Fase 2 (V-03).
        'preprocessing_config' => [
            'resize' => 'letterbox',
            'size' => 640,
            'color_order' => 'RGB',
            'normalize' => '1/255',
            'layout' => 'BCHW',
        ],

        // Eksekusi sinkron terproteksi timeout (V-08), dipakai Fase 2.
        'inference_timeout_seconds' => (int) env('ML_INFERENCE_TIMEOUT', 30),
    ],

    'pricing' => [
        // null = gunakan tahun dari tanggal server (PRD Bab 4.3, tidak di-hardcode).
        'reference_year' => env('MOTOLENS_REFERENCE_YEAR'),

        'age_depreciation_per_year' => 0.06,   // 6% / tahun
        'age_depreciation_max' => 0.60,        // maks 60%
        'min_price_ratio' => 0.30,             // batas bawah 30% harga standar

        'normal_km_per_year' => 10000,
        'excess_km_penalty_per_km' => 50,      // Rp50 / km berlebih
        'expired_tax_penalty' => 750000,       // Rp750.000

        // Pembulatan P_ml ke puluhan ribu: round(x, -4) (PRD Bab 4.5).
        'rounding_unit' => 10000,

        // Penalti visual per kelas (PRD Bab 4.4).
        'visual_penalty' => [
            'Scratch' => ['per_detection' => 0.025, 'max' => 0.10],
            'Dent' => ['per_detection' => 0.050, 'max' => 0.15],
            'Accident' => ['per_detection' => 0.075, 'max' => 0.20],
        ],
        'visual_penalty_total_max' => 0.30,

        // Label harga (PRD Bab 4.6).
        'label_lower_ratio' => 0.95,
        'label_upper_ratio' => 1.05,

        // Grade visual (PRD Bab 4.7): lecet_ringan jika 0 < D_visual <= batas ini.
        'grade_light_max_penalty' => 0.10,

        // Batas kewajaran harga penjual terhadap harga standar (PRD Bab 4.9).
        'seller_price_min_ratio_of_standard' => 0.05,
        'seller_price_max_ratio_of_standard' => 1.50,
    ],

    'seed' => [
        // Password demo hanya dari environment demo (PRD Bab 11.5, 14.2).
        'admin_password' => env('DEMO_ADMIN_PASSWORD', 'Password123!'),
        'user_password' => env('DEMO_USER_PASSWORD', 'Password123!'),
    ],

    /*
     * Kunci Spesifikasi Frontend (PRD v2.0.1 - Penyesuaian Infrastruktur):
     * Frontend motolens-web WAJIB menggunakan Next.js 16 (next@^16.0.0).
     */
    'frontend' => [
        'framework' => 'Next.js',
        'required_version' => '^16.0.0',
    ],
];
