# MotoLens Android Application

Aplikasi Android native sebagai alat inspeksi lapangan dan publikasi iklan motor bekas MotoLens.

## Teknologi & Arsitektur
- **Platform:** Android SDK (minSdk 26+, targetSdk 35)
- **Language:** Kotlin
- **Kamera:** Android Jetpack CameraX (kamera belakang langsung, tanpa jalur upload galeri pada inspeksi resmi)
- **Lokasi & Geotagging:** Google Play Services Location API (perekaman latitude, longitude, dan accuracy radius dengan izin eksplisit)
- **Networking:** Retrofit2 / OkHttp3 (multipart upload ke endpoint `/api/v1/motorcycles/inspect`)
- **Penyimpanan Kredensial:** Android Keystore / EncryptedSharedPreferences

## Lingkup Fitur (Fase 5)
1. **Autentikasi & Pengaturan Base URL:** Login Sanctum token dan konfigurasi host API backend untuk development/demo.
2. **Live Camera Scanner:** Panduan sudut pengambilan foto motor secara terarah.
3. **Form Spesifikasi Kendaraan:** Input model referensi, tahun, odometer, dan status pajak.
4. **Inspeksi Bodi AI Lapangan:** Pengiriman foto dan koordinat GPS secara sinkron/asinkron ke backend, menampilkan foto anotasi dengan deteksi kerusakan visual (`Accident`, `Dent`, `Scratch`).
5. **Rincian Taksiran Harga & Penerbitan Iklan:** Taksiran sistem berbasis aturan dan penerbitan listing langsung ke marketplace.
