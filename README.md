# MotoLens — AI Used Motorcycle Marketplace & Visual Damage Inspection (Bali)

[![Release](https://img.shields.io/badge/release-v1.0.0-DC2626)](docs/PRD.md)
[![Backend](https://img.shields.io/badge/Laravel_13-PHP_8.2%2B-FF2D20)](backend/)
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
├── ML/                   # Artefak Model YOLOv8n ONNX (model_damage.onnx, model_metadata.json, yolo_infer.py, evaluasi & notebook)
├── docs/                 # Dokumentasi Teknis & Panduan Sidang:
│   ├── PRD.md            # Product Requirements Document (MotoLens_PRD_v2.0.1.md)
│   ├── API_CONTRACT.md   # Spesifikasi Kontrak REST API /api/v1
│   ├── ML_MODEL_CARD.md  # Dokumentasi Metrik & Batasan Model YOLOv8n ONNX
│   └── DEMO_GUIDE.md     # Panduan Persiapan & Skenario Demo Live Sidang Capstone
└── docker-compose.yml    # Orkestrasi Full-Stack 4 Container (PostgreSQL 16, Redis 7, Backend Port 8000, Frontend Port 3000)
```

---

## 2. Cara Menjalankan Seluruh Aplikasi (Docker Full-Stack)

Seluruh layanan (`postgres`, `redis`, `backend` termasuk Python ONNX Runtime di `/opt/venv`, dan `frontend`) telah dikontainerisasi dan dapat dinyalakan dengan satu perintah:

```bash
docker compose up -d
```

### Akses Layanan Lokal
| Layanan | URL / Port | Keterangan |
|---|---|---|
| **Web Showroom & Admin** | `http://localhost:3000` | Katalog Publik, Simulator AI, Komparasi, Garasi Saya (`/garasi-saya`), Admin (`/admin`) |
| **Backend REST API** | `http://localhost:8000/api/v1` | Endpoint utama untuk Web & Android |
| **API Health Check** | `http://localhost:8000/api/v1/health` | Pemeriksaan status PostgreSQL, Redis, Model ONNX, dan Python |
| **PostgreSQL 16** | `localhost:5433` (Container `5432`) | Database utama `motolens` |
| **Redis 7** | `localhost:6379` | Cache katalog & session store |

---

## 3. Akun Demo Capstone (PRD Bab 11.5 & Bab 14.2)

> **Catatan Keamanan:** Kredensial di bawah ini khusus untuk lingkungan demo/pengujian lokal dan disertakan melalui `UserSeeder`.

| Role | Email | Password | Nomor WhatsApp | Akses Platform |
|---|---|---|---|---|
| **User (Penjual & Pembeli)** | `user@motolens.id` | `Password123!` | `081200000000` (`6281200000000`) | Android CameraX App & Web `/garasi-saya` |
| **Administrator** | `admin@motolens.id` | `Password123!` | `081236009999` (`6281236009999`) | Web Admin Console `/admin` |

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
# 1. Backend Laravel 13 (118 Feature & Unit Tests + ONNX Real Inference Test)
cd backend && php artisan test

# 2. Frontend Next.js 16 (TypeScript Strict Check & Production Build)
cd frontend && npx tsc --noEmit && npm run build

# 3. Android Kotlin (JUnit Test Suite & Debug APK Assembly)
cd Android-App && ./gradlew testDebugUnitTest assembleDebug
```

Lihat **[`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md)** untuk panduan lengkap skenario demo live 7 menit saat sidang Capstone.
