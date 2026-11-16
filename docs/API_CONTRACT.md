# Dokumentasi Kontrak REST API MotoLens (`/api/v1`)

Dokumen ini merupakan spesifikasi kontrak antarmuka API MotoLens versi 1.0.0 sesuai `docs/PRD.md` Bab 6, Bab 7, dan Bab 11. Seluruh endpoint beralamat di basis `/api/v1`.

---

## 1. Standar Format Respons (Bab 6.1)

Seluruh endpoint API mengembalikan respons JSON baku yang seragam.

### Format Sukses (`HTTP 200` / `201`)
```json
{
  "success": true,
  "message": "Operasi berhasil dilakukan.",
  "data": { ... },
  "meta": { ... }
}
```

### Format Gagal (`HTTP 400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`)
```json
{
  "success": false,
  "message": "Validasi gagal.",
  "errors": {
    "field_name": [
      "Pesan error rinci..."
    ]
  },
  "data": null
}
```

> [!IMPORTANT]
> Sistem tidak pernah membocorkan stack trace, struktur path lokal server, atau kredensial/secret pada respons `500 Internal Server Error`.

---

## 2. Autentikasi & Otorisasi (Laravel Sanctum)

- Menggunakan Header standar HTTP:
  ```http
  Authorization: Bearer <token_sanctum>
  Accept: application/json
  ```
- Role didukung:
  * `user`: Pengguna umum (pembeli & penjual motor).
  * `admin`: Administrator platform MotoLens.

---

## 3. Daftar Endpoint Lengkap

### 3.1. Health Check
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | Status koneksi PostgreSQL, Cache, Model ONNX, dan Python |

### 3.2. Autentikasi (`/auth`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public (Throttle: 5/m) | Registrasi akun baru (otomatis role `user`) |
| `POST` | `/api/v1/auth/login` | Public (Throttle: 5/m) | Login dan terbitkan token Sanctum |
| `POST` | `/api/v1/auth/logout` | Sanctum | Revoke token aktif pengguna |
| `GET` | `/api/v1/auth/me` | Sanctum | Ambil profil pengguna aktif & peran |

### 3.3. Model Referensi Kendaraan (`/motorcycle-models`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/motorcycle-models` | Public | Daftar model motor aktif (filter: `brand`, `category`, `search`) |

### 3.4. Katalog, Komparasi & Garasi Motor (`/motorcycles`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/motorcycles` | Public | Katalog motor approved dengan filter (`brand`, `model`, `year`, `min_price`, `max_price`, `price_label`, `condition_grade`, `location`, `search`, `sort`) |
| `GET` | `/api/v1/motorcycles/compare?ids=1,2` | Public | Komparasi 2–3 unit motor berdampingan |
| `GET` | `/api/v1/motorcycles/{id}` | Public | Detail listing, sertifikat inspeksi AI & Explainable Price Breakdown |
| `GET` | `/api/v1/my-motorcycles` | Sanctum | Daftar motor milik user aktif (Garasi Saya) |
| `POST` | `/api/v1/motorcycles` | Sanctum | Terbitkan listing baru dari hasil inspeksi |
| `PUT/PATCH` | `/api/v1/motorcycles/{id}` | Sanctum (Policy) | Perbarui harga/deskripsi/status listing |
| `DELETE` | `/api/v1/motorcycles/{id}` | Sanctum (Policy) | Arsipkan / soft delete listing |

### 3.5. Inspeksi AI YOLOv8 (`/motorcycles/inspect` & `/inspections`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/v1/motorcycles/inspect` | Sanctum (Throttle: 10/m) | Unggah foto bodi (`multipart/form-data`) & jalankan inferensi AI |
| `GET` | `/api/v1/inspections/{id}` | Sanctum (Policy) | Detail sertifikat hasil inspeksi |
| `GET` | `/api/v1/motorcycles/{id}/inspections` | Sanctum (Policy) | Riwayat inspeksi unit motor |
| `POST` | `/api/v1/inspections/{id}/feedback` | Sanctum (Policy) | Kirim feedback koreksi hasil AI |

### 3.6. Booking / Survei Fisik (`/inquiries`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/inquiries` | Sanctum | Daftar survei (filter: `?role=buyer` atau `?role=seller`) |
| `POST` | `/api/v1/inquiries` | Sanctum | Ajukan jadwal survei fisik (notifikasi dikirim ke penjual) |
| `PATCH` | `/api/v1/inquiries/{id}/status` | Sanctum (Policy) | Penjual merespons (`accepted`, `rejected`, `completed`) |
| `POST` | `/api/v1/inquiries/{id}/cancel` | Sanctum (Policy) | Pembeli membatalkan survei |

### 3.7. Notifikasi Pengguna (`/notifications`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Sanctum | Daftar notifikasi pengguna aktif beserta `unread_count` |
| `PATCH` | `/api/v1/notifications/{id}/read` | Sanctum | Tandai 1 notifikasi sudah dibaca |
| `POST` | `/api/v1/notifications/read-all` | Sanctum | Tandai seluruh notifikasi sudah dibaca |

### 3.8. Favorit Motor (`/favorites` & `/motorcycles/{id}/favorite`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/v1/motorcycles/{id}/favorite` | Sanctum | Toggle simpan/hapus unit dari daftar favorit |
| `GET` | `/api/v1/favorites` | Sanctum | Daftar motor favorit milik pengguna aktif |

### 3.9. Pelaporan Listing (`/motorcycles/{id}/reports`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/v1/motorcycles/{id}/reports` | Sanctum | Laporkan listing mencurigakan/fraud (dilarang melaporkan motor sendiri) |

### 3.10. Admin Dashboard, Moderasi & Review (`/admin`)
| Method | Endpoint | Auth & Role | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | Sanctum + `admin` | Metrik ringkasan pasar & statistik AI |
| `GET` | `/api/v1/admin/activity-logs` | Sanctum + `admin` | Audit log aktivitas pengguna dan entitas |
| `GET` | `/api/v1/admin/motorcycles` | Sanctum + `admin` | Daftar listing untuk moderasi |
| `PATCH` | `/api/v1/admin/motorcycles/{id}/moderation` | Sanctum + `admin` | Setujui / tolak listing motor (notifikasi dikirim ke penjual) |
| `GET` | `/api/v1/admin/reports` | Sanctum + `admin` | Daftar laporan listing dari pengguna |
| `PATCH` | `/api/v1/admin/reports/{id}` | Sanctum + `admin` | Perbarui status penanganan laporan (`open`, `reviewing`, `resolved`, `dismissed`) |
| `GET` | `/api/v1/admin/inspection-feedbacks` | Sanctum + `admin` | Daftar feedback koreksi deteksi AI |
| `PATCH` | `/api/v1/admin/inspection-feedbacks/{id}` | Sanctum + `admin` | Tinjau feedback AI (`pending`, `accepted`, `rejected`) |
| `GET` | `/api/v1/admin/inspections/metrics` | Sanctum + `admin` | Metrik inferensi YOLOv8 & akurasi |
| `POST` | `/api/v1/admin/motorcycle-models` | Sanctum + `admin` | Buat model referensi baru |
| `PUT` | `/api/v1/admin/motorcycle-models/{id}` | Sanctum + `admin` | Ubah data master model referensi |
| `DELETE` | `/api/v1/admin/motorcycle-models/{id}` | Sanctum + `admin` | Hapus / nonaktifkan master model referensi |

---

## 4. Struktur Explainable Price Breakdown (Bab 4.8)

Pada endpoint `GET /api/v1/motorcycles/{id}`, objek `price_breakdown` menyajikan rumus taksiran harga secara transparan:
```json
{
  "standard_price": 28000000,
  "vehicle_year": 2023,
  "vehicle_age_years": 3,
  "age_depreciation_percent": 24.0,
  "age_depreciation_amount": 6720000,
  "odometer_km": 25000,
  "odometer_penalty": 0,
  "tax_status": "active",
  "tax_penalty": 0,
  "base_depreciated_price": 21280000,
  "detection_counts": {
    "scratch": 2,
    "dent": 1,
    "accident": 0
  },
  "visual_penalty_per_class_percent": {
    "scratch": 4.0,
    "dent": 5.0,
    "accident": 0.0
  },
  "visual_penalty_percent": 9.0,
  "damage_penalty_percent": 9.0,
  "ml_predicted_price": 19364800,
  "seller_price": 19500000,
  "price_label": "fair_price",
  "condition_grade": "B",
  "confidence_threshold": 0.35,
  "model_version": "v1.0.0"
}
```

---

## 5. Integrasi Frontend Web (Next.js 16 App Router)

Sesuai `docs/PRD.md` Bab 2 dan Bab 7, platform Web MotoLens dikembangkan menggunakan **Next.js 16 App Router (`next@^16.0.0`)**, React 19, TypeScript, Tailwind CSS, dan Zustand untuk state management. Klien web mengonsumsi seluruh REST API ini secara eksklusif melalui basis URL `/api/v1` dengan token Sanctum Bearer Auth.

---

## 6. File Spesifikasi OpenAPI 3.0

Spesifikasi mesin lengkap tersedia di file [backend/docs/openapi.yaml](file:///c:/Users/Acer/.gemini/antigravity/scratch/motolens/backend/docs/openapi.yaml).
