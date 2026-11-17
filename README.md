# MotoLens — AI-Powered Used Motorcycle Inspection & Marketplace Ecosystem

MotoLens adalah platform ekosistem inspeksi dan marketplace motor bekas yang mengintegrasikan kecerdasan buatan (YOLOv8 ONNX Object Detection) untuk deteksi kerusakan bodi secara transparan, taksiran harga pintar berbasis aturan, perbandingan unit, dan booking survei fisik di wilayah Bali.

---

## 1. Arsitektur Monorepo

Struktur direktori monorepo MotoLens mengacu pada Bab 17 PRD:

```text
motolens/
├── Android-App/              # Aplikasi Android Kotlin CameraX & Geotagging (Fase 5)
├── backend/                  # Laravel 13 REST API Core
│   ├── app/
│   │   ├── Enums/            # Domain Enums (DamageClass, PriceLabel, ConditionGrade, dll)
│   │   ├── Events/           # Domain Events (InquiryCreated, InquiryStatusUpdated, dll)
│   │   ├── Http/
│   │   │   ├── Controllers/  # Thin Controllers REST API /api/v1
│   │   │   ├── Requests/     # Form Requests validasi input
│   │   │   └── Resources/    # API Resources (Explainable Price Breakdown)
│   │   ├── Models/           # Eloquent Models & Spatie traits
│   │   ├── Notifications/    # Database Notifications (Inquiry, Moderation)
│   │   ├── Policies/         # Otorisasi kepemilikan listing, inquiry, dan admin
│   │   ├── Repositories/     # Query katalog terisolasi & survey booking
│   │   └── Services/         # YoloInspectionService, PriceEstimationService, MotorcycleService, InquiryService
│   ├── config/motolens.php   # Konfigurasi parameter ML & rumus depresiasi harga
│   ├── database/             # 15 Migrations, 5 Seeders (50+ listing Bali), Factories
│   ├── docs/openapi.yaml     # Spesifikasi mesin OpenAPI 3.0
│   ├── routes/api.php        # Routing REST API /api/v1 terlindungi Sanctum & Spatie
│   ├── scripts/yolo_infer.py # Skrip inferensi backend via Process
│   ├── storage/app/ml/       # Direktori runtime model ONNX
│   └── tests/                # 118 Automated Tests (Unit & Feature 100% PASS)
├── docker/                   # Konfigurasi container
│   └── postgres/init.sql     # Inisialisasi database motolens & motolens_test
├── docker-compose.yml        # Multi-container PostgreSQL 16 & Redis 7
├── docs/                     # Dokumentasi proyek
│   ├── API_CONTRACT.md       # Dokumentasi Kontrak REST API /api/v1
│   ├── ML_MODEL_CARD.md      # Model Card YOLOv8n damage detection
│   └── PRD.md                # Spesifikasi lengkap MotoLens PRD v2.0.1
├── frontend/                 # Frontend Next.js 16 App Router (Fase 4)
└── ML/                       # Artefak model YOLOv8 ONNX, notebook training, dan metrik evaluasi
    ├── evaluation/
    │   └── metrics.json      # Ringkasan metrik eksperimen (mAP@50 84.34%)
    ├── model_damage.onnx     # Artefak ONNX (Opset 18, input 1x3x640x640, output 1x7x8400)
    ├── model_metadata.json   # Metadata immutable model & threshold
    ├── MotoLens_YOLOv8_Training.ipynb # Notebook training Colab (kredensial diamankan)
    └── yolo_infer.py         # Skrip Python inferensi mandiri
```

---

## 2. Status Pengembangan (Roadmap)

| Fase | Komponen | Status | Hasil Verifikasi |
|---|---|:---:|---|
| **Fase 0** | Audit Repository & Artefak ML | **SELESAI** | Model ONNX 12.2MB terverifikasi SHA-256 |
| **Fase 1** | Database, Models, Seeders, 100% PostgreSQL | **SELESAI** | 15 Migrations, Seeders 58 listing Bali, 48 Test PASS |
| **Fase 2** | Core Application (YOLO ONNX, Services, Repositories, Policies) | **SELESAI** | Skrip inferensi nyata, kalkulasi harga Bab 4, 74 Test PASS |
| **Fase 3** | REST API Laravel `/api/v1` (Controllers, Resources, Sanctum, Notifications) | **SELESAI** | Endpoints lengkap, OpenAPI 3.0, 118 Test PASS (3.974 assertions) |
| **Fase 4** | Frontend Next.js 16 App Router | *SELANJUTNYA* | Persiapan modul `frontend/` |
| **Fase 5** | Android Kotlin CameraX Scanner | *TERENCANA* | Persiapan modul `Android-App/` |

---

## 3. Menjalankan Infrastruktur Docker & Backend

### Prasyarat
- Docker Desktop & Docker Compose
- PHP 8.2+ dengan ekstensi `pdo_pgsql`
- Python 3.10+ (dengan `onnxruntime`, `opencv-python-headless`, `numpy`)
- Composer

### Langkah Cepat

1. **Jalankan Database PostgreSQL & Redis via Docker:**
   ```bash
   docker compose up -d
   ```
   *Container membuat database `motolens` (aplikasi utama) dan `motolens_test` (automated test) pada port 5433.*

2. **Setup Backend Laravel:**
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

3. **Jalankan Migrasi & Seeder Database:**
   ```bash
   php artisan migrate:fresh --seed
   ```
   *Membuat 25 model motor referensi, akun demo (`admin@motolens.id`, `user@motolens.id`), dan 58 listing motor bekas di wilayah Bali.*

4. **Jalankan Automated Test Suite (100% PostgreSQL Murni):**
   ```bash
   php artisan test
   ```
   *Seluruh 74 test (Unit & Feature) berjalan di atas database `motolens_test` tanpa SQLite.*

5. **Menjalankan Inferensi YOLO Mandiri:**
   ```bash
   python backend/scripts/yolo_infer.py --model backend/storage/app/ml/model_damage.onnx --input <path_to_foto> --output <path_output_anotasi>
   ```

---

## 4. Akun Demo

| Role | Email | Password Default |
|---|---|---|
| Admin | `admin@motolens.id` | `Password123!` (dapat diubah via `DEMO_ADMIN_PASSWORD`) |
| User | `user@motolens.id` | `Password123!` (dapat diubah via `DEMO_USER_PASSWORD`) |

