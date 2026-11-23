# Panduan Demo Live Sidang Capstone MotoLens (`v1.0.1`)

Dokumen ini berisi daftar periksa persiapan teknis 5 menit sebelum sidang, skenario demonstrasi *end-to-end* selama 7 menit, serta panduan pemecahan masalah cepat (*troubleshooting*).

---

## 1. Checklist 5 Menit Sebelum Sidang

### Langkah 1: Pastikan File `.env` Terkonfigurasi di Root Monorepo
Jika baru pertama kali menyiapkan environment:
```bash
cp .env.example .env
```
- Isi `POSTGRES_PASSWORD` dan `DB_PASSWORD` pada `.env` dengan nilai kuat yang sama.
- Isi `APP_KEY` pada `.env` dengan hasil dari:
  ```bash
  docker compose run --rm backend php artisan key:generate --show
  ```
- **Catatan Keamanan Infrastruktur:** Port PostgreSQL (`5432`) dan Redis (`6379`) diisolasi di dalam jaringan internal Docker Compose dan tidak dipublish ke host. Service `backend` berjalan dengan profil aman `APP_ENV=production` dan `APP_DEBUG=false`.

### Langkah 2: Nyalakan Container Full-Stack Docker
Buka terminal di root folder `motolens/` dan jalankan:
```bash
docker compose up -d
docker compose ps
```
Pastikan keempat container (`motolens-postgres`, `motolens-redis`, `motolens-backend`, `motolens-frontend`) berstatus **Up / Healthy**.

### Langkah 3: Verifikasi Kesehatan Backend & Model YOLOv8 ONNX
Buka atau jalankan di terminal:
```bash
curl.exe -s http://localhost:8000/api/v1/health
```
Pastikan output JSON menampilkan `"status": "healthy"`, `"database": "connected"`, `"ml_model": "available"`, dan `"python": "available"`.

### Langkah 4: Hubungkan HP Android Fisik ke Backend Laptop
Pilih **salah satu** dari dua metode paling stabil berikut:

- **Opsi A — Kabel USB dengan ADB Reverse (Paling Stabil, Bebas Masalah Wi-Fi/Firewall):**
  1. Hubungkan HP Android ke laptop dengan kabel USB (pastikan *USB Debugging* aktif).
  2. Jalankan perintah berikut di terminal laptop:
     ```bash
     adb devices
     adb reverse tcp:8000 tcp:8000
     ```
  3. Di aplikasi Android MotoLens, klik tombol **"Server URL"** di pojok kanan atas, pilih preset **`ADB (127.0.0.1)`** (`http://127.0.0.1:8000/api/v1/`), klik **"Tes Koneksi"**, lalu klik **"Simpan URL"**.

- **Opsi B — Tanpa Kabel melalui Cloudflare Tunnel (HTTPS Publik):**
  1. Jalankan tunnel ke port 8000:
     ```bash
     cloudflared tunnel --url http://localhost:8000
     ```
  2. Salin URL HTTPS yang muncul (misal `https://xxxx-xxxx.trycloudflare.com`).
  3. Di aplikasi Android MotoLens, buka **"Server URL"**, ketik `https://xxxx-xxxx.trycloudflare.com/api/v1/`, klik **"Tes Koneksi"**, lalu klik **"Simpan URL"**.

---

## 2. Skenario Demo Live 7 Menit (End-to-End Flow)

### Tahap 1 — Inspeksi Lapangan CameraX di HP Android (Menit 1–2)
1. Buka aplikasi **MotoLens AI Showroom** di HP Android.
2. Buka tab **Login**, lalu tekan tombol sekali klik **"Demo User (user@motolens.id)"**.
3. Tekan tab **"Inspeksi AI"** di navigasi bawah untuk membuka **CameraX Live Scanner**:
   - Tunjukkan kepada penguji bahwa aplikasi **hanya membuka kamera belakang secara langsung** dengan **Frame Guide Overlay** merah sporty dan **tidak memiliki tombol ambil foto dari galeri** (menjaga integritas `source_type = "android_camera"` sesuai PRD Bab 2.2 & Bab 9).
4. Ambil foto objek/bodi motor, lalu di layar **Form Spesifikasi**:
   - Pilih model referensi (contoh: `Honda PCX 160` atau `Yamaha NMAX 155`).
   - Masukkan tahun (`2023`), odometer (`14500` km), status pajak (`Pajak Hidup`), dan rencana harga jual (`Rp 24.500.000`).
   - Tekan **"Jalankan Deteksi AI & Estimasi Harga"**.

### Tahap 2 — Sertifikat AI, Bounding Box & Publikasi Iklan di Android (Menit 3–4)
1. Tunjukkan hasil pada layar **Sertifikat Inspeksi AI YOLOv8**:
   - Kanvas foto dengan **Bounding Box proporsional** (`Scratch`, `Dent`, `Accident`) beserta waktu inferensi dalam milidetik (`ms`).
   - Kartu **Explainable Price Breakdown (Bab 4.8)** yang menjabarkan harga standar, potongan depresiasi usia, penalti odometer, pajak, penalti visual AI, rekomendasi harga sistem, dan badge semantik (`GOOD DEAL` / `FAIR PRICE` / `OVERPRICED`).
2. Isi judul iklan dan lokasi di Bali (misal `Denpasar Barat, Bali`), lalu tekan **"Terbitkan Listing Sekarang"**.
3. Tunjukkan bahwa motor masuk ke tab **Garasi Saya** dengan badge status moderasi **`PENDING`**.

### Tahap 3 — Moderasi Admin & Analitik Pasar di Web Backoffice (Menit 5)
1. Di browser laptop, buka `http://localhost:3000/login` dan masuk menggunakan akun **Demo Admin (`admin@motolens.id`)**, lalu buka **Admin Console (`http://localhost:3000/admin`)**.
2. Tunjukkan **Overview & Analitik Pasar**, distribusi label harga Bali, serta **Metrik & Kesehatan ONNX**.
3. Buka menu **Moderasi Listing Motor** di sidebar kiri:
   - Temukan listing baru dari HP Android yang berstatus `pending`.
   - Klik tombol hijau **"Setujui"** (`approved`).

### Tahap 4 — Katalog Showroom Web, Komparasi Unit & Booking Survei via WhatsApp (Menit 6–7)
1. Kembali ke halaman utama Web Showroom (`http://localhost:3000`):
   - Tunjukkan listing yang baru disetujui kini tayang di katalog publik.
   - Klik ikon timbangan pada 2–3 kartu motor untuk mendemonstrasikan fitur **Komparasi Berdampingan (`/compare`)**.
2. Buka halaman detail motor (`/motorcycles/[id]`):
   - Tunjukkan Sertifikat Inspeksi AI interaktif dan ajukan **Jadwal Survei Fisik (COD)**.
3. Buka **Garasi Saya (`/garasi-saya?tab=seller_inquiries`)** atau tab **Survei Masuk** di HP Android:
   - Klik **"Terima Jadwal"** (`accepted`).
   - Tunjukkan tombol hijau **"Hubungi via WhatsApp"** yang langsung muncul pada jadwal survei yang telah disetujui dan membuka `https://wa.me/628xxx?text=...` dengan teks koordinasi otomatis.

---

## 3. Troubleshooting Cepat

1. **Error `adb: more than one device/emulator` saat menjalankan `adb reverse`:**
   - Cek daftar perangkat dengan `adb devices`.
   - Spesifikasikan serial HP fisik Anda:
     ```bash
     adb -s <SERIAL_HP> reverse tcp:8000 tcp:8000
     ```
2. **Akses Langsung ke Database PostgreSQL (Karena Port Tidak Diekspos ke Host):**
   ```bash
   docker compose exec postgres psql -U postgres -d motolens
   ```
3. **Mereset Database Demo ke Kondisi Awal (50+ Listing Bersih):**
   ```bash
   docker compose exec backend php artisan migrate:fresh --seed --force
   ```
