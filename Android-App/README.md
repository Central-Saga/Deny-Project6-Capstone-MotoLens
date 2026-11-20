# MotoLens Android Application (`Android-App/`)

Aplikasi native Android berbasis **Kotlin**, **Jetpack Compose (Material 3)**, **MVVM + Repository Pattern**, dan **AndroidX CameraX** sebagai alat inspeksi lapangan serta showroom jual beli motor bekas MotoLens di Bali.

---

## 1. Fitur Utama & Kepatuhan PRD (`MotoLens_PRD_v2.0.1.md`)

1. **Tema Visual Automotive Red-Carbon Showroom (`Color.kt` & `Theme.kt`):**
   - Selaras dengan Web Frontend Next.js 16: menggunakan kombinasi **Sporty Crimson Red (`#DC2626`)**, **Carbon Black (`#09090B` / `#18181B`)**, dan **Clean Showroom White (`#F8FAFC`)**.
   - Mempertahankan warna semantik PRD pada `PriceBadge` (`good_deal` Emerald `#10B981`, `fair_price` Sky Blue `#0284C7`, `overpriced` Rose Red `#E11D48`) dan `ConditionBadge`.
2. **Pengaturan Server API Dinamis (Tanpa Build Ulang APK — Bab 9 & Bab 12):**
   - Dapat diakses langsung dari halaman **Login**, **Katalog Showroom**, dan **Garasi Saya** melalui ikon pengaturan server (`ServerUrlDialog`).
   - Tersedia tombol preset cepat:
     * **Emulator Android ke Docker Host:** `http://10.0.2.2:8000/api/v1/`
     * **Localhost / ADB Reverse:** `http://127.0.0.1:8000/api/v1/`
     * **Custom URL:** Mendukung IP LAN Wi-Fi (`http://192.168.x.x:8000/api/v1/`) maupun HTTPS Cloudflare Tunnel (`https://*.trycloudflare.com/api/v1/`).
   - Dilengkapi tombol **"Tes Koneksi"** yang memanggil `GET /api/v1/health`.
3. **Kamera Inspeksi Lapangan CameraX (`CameraInspectionScreen.kt` — Bab 2.2 & Bab 9):**
   - Menggunakan **CameraX `PreviewView` & `ImageCapture`** secara langsung dari kamera belakang (`CameraSelector.DEFAULT_BACK_CAMERA`).
   - **Anti-Galeri:** Tidak menyediakan jalur ambil foto dari galeri pada alur inspeksi resmi untuk menjaga integritas `source_type = "android_camera"`.
   - Dilengkapi **Frame Guide Overlay** (panduan bingkai area bodi motor di tengah layar), indikator pencahayaan, geotagging GPS opsional (tanpa koordinat palsu jika izin ditolak), normalisasi rotasi EXIF, dan kompresi JPEG otomatis `<= 2 MB` (`ImageCompressor.kt`).
4. **Visualisasi Kanvas Bounding Box Proporsional (`BoundingBoxOverlay.kt` & `BoundingBoxScaler.kt` — Bab 3.5):**
   - Menskalakan koordinat deteksi `[x1, y1, x2, y2]` secara proporsional terhadap `image_width` dan `image_height` asli dengan memperhitungkan letterbox offset `ContentScale.Fit`.
5. **Explainable Price Breakdown, Feedback AI & Publikasi Iklan (`InspectionResultScreen.kt` — Bab 4.8):**
   - Menampilkan rincian depresiasi usia, penalti odometer, penalti pajak, penalti visual YOLOv8 (`Scratch`, `Dent`, `Accident`), fitur kirim Feedback AI (`POST /api/v1/inspections/{id}/feedback`), dan form publikasi iklan langsung ke katalog (`POST /api/v1/motorcycles`).

---

## 2. Arsitektur Direktori (`Android-App/`)

```text
Android-App/
├── app/
│   ├── build.gradle.kts
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/com/motolens/app/
│       │   │   ├── MotoLensApplication.kt
│       │   │   ├── MainActivity.kt
│       │   │   ├── data/
│       │   │   │   ├── local/SessionManager.kt
│       │   │   │   ├── model/ApiModels.kt
│       │   │   │   ├── remote/MotoLensApiService.kt
│       │   │   │   ├── remote/RetrofitClient.kt
│       │   │   │   └── repository/MotoLensRepository.kt
│       │   │   ├── ui/
│       │   │   │   ├── components/
│       │   │   │   │   ├── BadgesAndCards.kt
│       │   │   │   │   ├── BoundingBoxOverlay.kt
│       │   │   │   │   └── ServerUrlDialog.kt
│       │   │   │   ├── navigation/MotoLensNavGraph.kt
│       │   │   │   ├── screens/
│       │   │   │   │   ├── AuthScreens.kt
│       │   │   │   │   ├── HomeCatalogScreen.kt
│       │   │   │   │   ├── MotorcycleDetailScreen.kt
│       │   │   │   │   ├── CameraInspectionScreen.kt
│       │   │   │   │   ├── InspectionFormScreen.kt
│       │   │   │   │   ├── InspectionResultScreen.kt
│       │   │   │   │   └── GarageAndActivityScreens.kt
│       │   │   │   ├── theme/
│       │   │   │   │   ├── Color.kt
│       │   │   │   │   └── Theme.kt
│       │   │   │   └── viewmodel/MotoLensViewModel.kt
│       │   │   └── util/
│       │   │       ├── BoundingBoxScaler.kt
│       │   │       ├── Formatters.kt
│       │   │       └── ImageCompressor.kt
│       │   └── res/
│       └── test/java/com/motolens/app/
│           ├── BoundingBoxScalerTest.kt
│           ├── ApiModelAndRepositoryTest.kt
│           └── MotoLensViewModelTest.kt
├── build.gradle.kts
├── gradle/libs.versions.toml
├── gradle.properties
└── settings.gradle.kts
```

---

## 3. Panduan Menjalankan di Android Studio & Koneksi ke Docker Backend

1. Pastikan container backend MotoLens sudah berjalan:
   ```bash
   docker compose up -d
   ```
2. Buka **Android Studio**, pilih **Open**, lalu arahkan ke folder `Android-App/`.
3. Tunggu proses **Gradle Sync** selesai.
4. Pilih metode koneksi API dari menu **Server URL** di pojok kanan atas aplikasi:
   - **Android Emulator:** Pilih preset `http://10.0.2.2:8000/api/v1/`.
   - **HP Fisik dengan Kabel USB (ADB Reverse):**
     Jalankan `adb reverse tcp:8000 tcp:8000` di terminal, lalu pilih preset `http://127.0.0.1:8000/api/v1/`.
   - **HP Fisik via Wi-Fi LAN / Cloudflare Tunnel:**
     Masukkan IP komputer (`http://192.168.x.x:8000/api/v1/`) atau URL tunnel (`https://xxxx.trycloudflare.com/api/v1/`).

---

## 4. Menjalankan Unit Test & Build APK Debug via CLI

```bash
cd Android-App

# Menjalankan Unit Test (BoundingBoxScalerTest, ApiModelAndRepositoryTest, MotoLensViewModelTest)
./gradlew testDebugUnitTest

# Mem-build APK Debug (app/build/outputs/apk/debug/app-debug.apk)
./gradlew assembleDebug
```
