# MotoLens Web Frontend

Modul aplikasi web marketplace & inspeksi motor bekas MotoLens.

## Teknologi & Arsitektur
- **Framework:** Next.js 16 (`next@^16.0.0`) App Router (Fase 4)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Lucide Icons
- **State & Data Fetching:** Server Components by default, centralized API client ke Laravel REST API `/api/v1`

## Lingkup Fitur (Fase 4)
1. **Katalog Publik & Pencarian:** Filter merek, model, rentang tahun, kilometer, rentang harga, grade visual, dan label harga.
2. **Detail Listing & Sertifikat AI:** Visualisasi interaktif perbandingan foto asli vs foto anotasi bounding box YOLOv8, breakdown taksiran harga, dan indikator kesepakatan harga (`Good Deal`, `Fair Price`, `Overpriced`).
3. **Komparasi Unit:** Fitur perbandingan berdampingan 2–3 motor bekas.
4. **Booking Survei & Garasi Penjual:** Pengajuan jadwal survei fisik, manajemen listing di garasi saya, dan status ketersediaan motor.
5. **Dashboard Moderasi Admin:** Analitik pasar dan persetujuan listing.

