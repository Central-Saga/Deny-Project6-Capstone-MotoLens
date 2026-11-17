# MotoLens Web Frontend (`frontend/`)

Modul aplikasi web marketplace, sertifikat inspeksi AI YOLOv8, simulasi inspeksi browser, komparasi unit, dan dashboard admin MotoLens.

---

## 1. Teknologi & Arsitektur (Fase 4)
- **Framework:** Next.js 16 (`next@^16.0.0`) App Router
- **Runtime UI:** React 19 & TypeScript 5
- **Styling & Ikon:** Tailwind CSS v4 & Lucide React Icons
- **State & Auth:** React Context (`AuthProvider`, `CompareProvider`) terhubung penuh ke Laravel Sanctum REST API (`/api/v1`) tanpa data mock/hardcode.

---

## 2. Struktur Direktori (`frontend/src/`)
```text
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing & Katalog Interaktif (Filter, Sort, Favorit, Compare)
│   │   ├── login/page.tsx           # Autentikasi Sanctum & Tombol Cepat Demo Login (User & Admin)
│   │   ├── register/page.tsx        # Registrasi Akun Baru (Role User)
│   │   ├── motorcycles/[id]/page.tsx# Detail Listing, BoundingBoxViewer, Explainable Price Breakdown
│   │   ├── compare/page.tsx         # Komparasi Berdampingan 2–3 Unit Motor
│   │   ├── inspect-simulator/page.tsx # Simulasi Inspeksi Web (source_type = web_upload)
│   │   ├── garasi-saya/
│   │   │   ├── page.tsx             # Manajemen Listing, Survei Masuk/Keluar & Daftar Favorit
│   │   │   └── tambah/page.tsx      # Penerbitan Listing Baru dari Sertifikat Inspeksi AI
│   │   ├── admin/page.tsx           # Dashboard Admin (Analitik, Moderasi, CRUD Model, Metrik ONNX, Laporan & Audit Log)
│   │   ├── loading.tsx              # Global Loading State
│   │   ├── error.tsx                # Global Error Boundary
│   │   └── not-found.tsx            # Halaman HTTP 404
│   ├── components/
│   │   ├── shared/                  # Navbar, Footer, MobileBottomNav, FloatingCompareBar, PriceBadge, ConditionBadge, VerificationBadge, DamageSummaryPills, StateFeedback
│   │   └── features/                # BoundingBoxViewer, MotorcycleCard
│   ├── hooks/                       # useAuth, useCompare, useNotifications
│   ├── services/                    # apiClient, authService, motorcycleService, inspectionService, inquiryService, notificationService, adminService
│   ├── types/                       # Kontrak TypeScript (api, auth, motorcycle, inspection, inquiry, notification, admin)
│   └── utils/                       # formatters (IDR, WITA Asia/Makassar, WhatsApp) & boundingBox scaling
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Cara Menjalankan Development & Production Build

1. **Pastikan Server Laravel (`/api/v1`) Aktif di Port 8000:**
   ```bash
   cd ../backend
   php artisan serve --port=8000
   ```

2. **Konfigurasi Environment (`frontend/.env.local`):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_APP_NAME=MotoLens
   NEXT_PUBLIC_DISPLAY_TIMEZONE=Asia/Makassar
   ```

3. **Jalankan Server Development Next.js 16:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Verifikasi Type Check & Production Build:**
   ```bash
   npx tsc --noEmit
   npm run build
   ```
