# MotoLens — AI Used Motorcycle Marketplace & Visual Damage Inspection (Bali)

[![CI](https://github.com/Central-Saga/Deny-Project6-Capstone-MotoLens/actions/workflows/ci.yml/badge.svg)](https://github.com/Central-Saga/Deny-Project6-Capstone-MotoLens/actions/workflows/ci.yml)
[![Release](https://img.shields.io/badge/release-v1.0.1-DC2626)](docs/PRD.md)
[![Backend](https://img.shields.io/badge/Laravel_13-PHP_8.3-FF2D20)](backend/)
[![Frontend](https://img.shields.io/badge/Next.js_16-App_Router-000000)](frontend/)
[![Android](https://img.shields.io/badge/Android_Kotlin-CameraX_Jetpack_Compose-3DDC84)](Android-App/)
[![ML](https://img.shields.io/badge/YOLOv8n_ONNX-84.34%25_mAP%4050-00599C)](ML/)

**MotoLens** adalah ekosistem jual beli motor bekas di Bali yang mengintegrasikan **Computer Vision (YOLOv8n ONNX Runtime)** untuk mendeteksi kerusakan visual bodi luar (*Scratch*, *Dent*, *Accident*) dengan sistem **Explainable Price Breakdown** (depresiasi berbasis aturan pasar Bali yang transparan dan dapat diaudit).

---

## 1. Struktur Monorepo

```text
motolens/
├── backend/              # REST API Laravel 13 (/api/v1), Sanctum Auth, Spatie Media/Permission/Activitylog, & Python ONNX Runner
├── frontend/             # Web Marketplace & Admin Backoffice (Next.js 16 App Router, TypeScript, Tailwind CSS)
├── Android-App/          # Aplikasi Mobile Inspeksi Lapangan (Kotlin, Jetpack Compose Material 3, MVVM, CameraX Live Scanner)
├── ML/                   # Pipeline Training & Evaluasi YOLOv8n (MotoLens_YOLOv8_Training.ipynb [stripped], model_metadata.json, yolo_infer.py, evaluation/metrics.json)
├── docs/                 # Dokumentasi Teknis & Panduan Sidang:
│   ├── PRD.md            # Product Requirements Document (MotoLens_PRD_v2.0.1.md)
│   ├── API_CONTRACT.md   # Spesifikasi Kontrak REST API /api/v1
│   ├── ML_MODEL_CARD.md  # Dokumentasi Metrik & Batasan Model YOLOv8n ONNX
│   ├── ML_TRAINING_REPORT.md # Laporan Lengkap Ekstraksi Metrik Training & Panduan Checksum ONNX
│   └── DEMO_GUIDE.md     # Panduan Persiapan & Skenario Demo Live Sidang Capstone
├── .env.example          # Template konfigurasi environment Docker Compose (tanpa rahasia)
├── .pre-commit-config.yaml # Hook nbstripout otomatis untuk menjaga notebook tetap bersih dari output
└── docker-compose.yml    # Orkestrasi Full-Stack 4 Container (PostgreSQL 16, Redis 7, Backend Port 8000, Frontend Port 3000)
```

---

## 2. Konfigurasi `.env` & Cara Menjalankan Aplikasi (Docker Full-Stack)

Demi keamanan (*Security By Design*), kredensial database dan kunci enkripsi Laravel tidak di-hardcode di dalam `docker-compose.yml`, melainkan dimuat melalui `env_file: .env` (yang diabaikan oleh Git).

### Langkah 1: Salin `.env.example` ke `.env` & Isi Kredensial
```bash
cp .env.example .env
```
Buka file `.env` dan pastikan variabel berikut terisi:
1. **`POSTGRES_PASSWORD` & `DB_PASSWORD`**: Isi dengan kata sandi acak yang kuat dan identik.
2. **`APP_KEY`**: Generate kunci enkripsi 32-byte base64 baru menggunakan salah satu perintah berikut:
   ```bash
   # Opsi A — Menggunakan OpenSSL:
   echo "base64:$(openssl rand -base64 32)"

   # Opsi B — Menggunakan container backend:
   docker compose run --rm backend php artisan key:generate --show
   ```
   Tempelkan hasilnya ke `APP_KEY=` di dalam file `.env`.

### Langkah 2: Unduh Artefak Model Kanonis `model_damage.onnx` (Jika Baru Clone Repo)
File biner `model_damage.onnx` (~12,18 MB) didistribusikan melalui **GitHub Release `v1.0.1`** (tidak di-*commit* ke dalam Git agar repositori tetap ringan) dan disimpan di satu lokasi kanonis: **`backend/storage/app/ml/model_damage.onnx`**.

```bash
# Unduh via GitHub CLI (gh):
gh release download v1.0.1 \
  --repo Central-Saga/Deny-Project6-Capstone-MotoLens \
  --pattern "model_damage.onnx" \
  --dir backend/storage/app/ml \
  --clobber

# Atau unduh langsung via curl:
curl.exe -fL \
  https://github.com/Central-Saga/Deny-Project6-Capstone-MotoLens/releases/download/v1.0.1/model_damage.onnx \
  -o backend/storage/app/ml/model_damage.onnx
```

Verifikasi integritas SHA-256 (`22ec0d55bdb32939ae8ca5cd4bb1207ab8576f4775f8c5e32359ceb81ab49edd`):
```powershell
# PowerShell (Windows):
(Get-FileHash backend/storage/app/ml/model_damage.onnx -Algorithm SHA256).Hash.ToLower()

# Bash (Linux / macOS):
echo "22ec0d55bdb32939ae8ca5cd4bb1207ab8576f4775f8c5e32359ceb81ab49edd  backend/storage/app/ml/model_damage.onnx" | sha256sum -c -
```
> Untuk laporan lengkap metrik training (Baseline vs Tuned v1 vs Optimized v2) serta panduan mereproduksi model dari [`ML/MotoLens_YOLOv8_Training.ipynb`](ML/MotoLens_YOLOv8_Training.ipynb), lihat **[`docs/ML_TRAINING_REPORT.md`](docs/ML_TRAINING_REPORT.md)**.

### Langkah 3: Nyalakan Container & Seeder Data Demo
```bash
docker compose up -d --build
docker compose exec backend php artisan db:seed --force
```

### Akses Layanan & Isolasi Jaringan
| Layanan | URL / Akses | Keterangan |
|---|---|---|
| **Web Showroom & Admin** | `http://localhost:3000` | Katalog Publik, Simulator AI, Komparasi, Garasi Saya (`/garasi-saya`), Admin (`/admin`) |
| **Backend REST API** | `http://localhost:8000/api/v1` | Endpoint utama untuk Web & Android (`APP_ENV=production`, `APP_DEBUG=false`) |
| **API Health Check** | `http://localhost:8000/api/v1/health` | Pemeriksaan status PostgreSQL, Redis, Model ONNX, dan Python |
| **PostgreSQL 16** | Internal Docker Network (`postgres:5432`) | Port **tidak diekspos ke host** demi keamanan. Akses CLI: `docker compose exec postgres psql -U postgres -d motolens` |
| **Redis 7** | Internal Docker Network (`redis:6379`) | Port **tidak diekspos ke host** demi keamanan (hanya diakses internal oleh `backend`). |

---

## 3. Akun Demo Capstone (PRD Bab 11.5 & Bab 14.2)

> **Catatan Keamanan:** Kredensial di bawah ini khusus untuk lingkungan demo/pengujian lokal dan disertakan melalui `UserSeeder`.

| Role | Email | Nomor WhatsApp | Akses Platform |
|---|---|---|---|
| **User (Penjual & Pembeli)** | `user@motolens.id` | `081200000000` (`6281200000000`) | Android CameraX App & Web `/garasi-saya` |
| **Administrator** | `admin@motolens.id` | `081236009999` (`6281236009999`) | Web Admin Console `/admin` |

*(Kata sandi akun demo mengikuti konfigurasi seeder environment demo di [`backend/config/motolens.php`](backend/config/motolens.php)).*

---

## 4. Instalasi & Konfigurasi Aplikasi Android (`Android-App/`)

1. **Lokasi APK Debug Siap Pasang:**
   ```text
   Android-App/app/build/outputs/apk/debug/app-debug.apk
   ```
2. **Build melalui CLI / Android Studio:**
   ```bash
   cd Android-App
   ./gradlew testDebugUnitTest assembleDebug
   ```
3. **Konfigurasi Server API Dinamis (Tanpa Build Ulang APK):**
   Klik tombol **"Server URL"** di pojok kanan atas halaman Login atau Katalog Android:
   - **Android Emulator:** Pilih preset `http://10.0.2.2:8000/api/v1/`
   - **HP Fisik via Kabel USB (ADB Reverse — Direkomendasikan saat Sidang):**
     Jalankan `adb reverse tcp:8000 tcp:8000` di terminal laptop, lalu pilih preset `http://127.0.0.1:8000/api/v1/`
   - **HP Fisik via Cloudflare Tunnel / Wi-Fi LAN:**
     Masukkan URL `https://xxxx.trycloudflare.com/api/v1/` atau `http://<IP_LAN_LAPTOP>:8000/api/v1/`

---

## 5. Pengujian & Verifikasi Kualitas

```bash
# 1. Backend Laravel 13 (118 Feature & Unit Tests + ONNX Real Inference Test di dalam container)
docker compose exec backend php artisan test

# 2. Frontend Next.js 16 (TypeScript Strict Check & Production Build)
cd frontend && npx tsc --noEmit && npm run build

# 3. Android Kotlin (JUnit Test Suite & Debug APK Assembly)
cd Android-App && ./gradlew testDebugUnitTest assembleDebug
```

Lihat **[`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md)** untuk panduan lengkap skenario demo live 7 menit saat sidang Capstone.
