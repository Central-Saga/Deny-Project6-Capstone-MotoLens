# Model Card — MotoLens YOLOv8n Damage Detection (`model_damage.onnx`)

## 1. Ringkasan Model (Model Details)
- **Nama Model:** `model_damage`
- **Versi:** `optimized_v2`
- **Arsitektur:** YOLOv8n (Nano) Object Detection
- **Framework Training:** Ultralytics YOLO (v8.4.211)
- **Format Artefak Produksi:** ONNX (Opset 18, Simplified)
- **Nama File:** `model_damage.onnx`
- **SHA-256 Checksum:** `22ec0d55bdb32939ae8ca5cd4bb1207ab8576f4775f8c5e32359ceb81ab49edd`
- **Ukuran File:** 12.775.147 bytes (~12.2 MB)

---

## 2. Kelas Deteksi (Target Classes)
Berdasarkan metadata model aktual (PRD Bab 3.2 & Bab 19.5):

| Index | Label Kelas | Terjemahan / Makna | Aturan Penalti Visual (PRD Bab 4.4) |
|---|---|---|---|
| 0 | `Accident` | Indikasi kerusakan akibat benturan / kecelakaan | 7.5% per deteksi (maks 20.0%) |
| 1 | `Dent` | Penyok pada bodi kendaraan | 5.0% per deteksi (maks 15.0%) |
| 2 | `Scratch` | Baret / goresan pada permukaan bodi | 2.5% per deteksi (maks 10.0%) |

> **Catatan Penting (PRD Aturan 4 & Bab 19.5):** Kelas `Accident` **BUKAN** `crack` (retak). Backend dan frontend wajib menggunakan nama kelas resmi `Accident` untuk menjaga integritas domain data.

---

## 3. Spesifikasi Tensor & Pipeline Inferensi

### Input Tensor
- **Nama Tensor:** `images`
- **Dimensi:** `(1, 3, 640, 640)` — Batch size 1, 3 channels, 640x640 pixel.
- **Tipe Data:** `float32`
- **Layout & Urutan Warna:** `BCHW`, `RGB`
- **Normalisasi:** Piksel `[0, 255]` diskalakan menjadi rentang float `[0.0, 1.0]` (`1/255`).
- **Preprocessing:** *Letterbox resizing* mempertahankan aspect ratio asli dengan padding border bernilai abu-abu `(114, 114, 114)`.

### Output Tensor & Postprocessing
- **Nama Tensor:** `output0`
- **Dimensi:** `(1, 7, 8400)`
- **Kanal Output (7):**
  - Index 0: `cx` (Center X pada frame letterbox)
  - Index 1: `cy` (Center Y pada frame letterbox)
  - Index 2: `w` (Width box)
  - Index 3: `h` (Height box)
  - Index 4: Skor probabilitas kelas `Accident`
  - Index 5: Skor probabilitas kelas `Dent`
  - Index 6: Skor probabilitas kelas `Scratch`
- **Kandidat Deteksi:** 8.400 anchor candidates.
- **Filtering & NMS:**
  - `confidence_threshold`: Default **`0.35`** (dapat diatur via `.env` `ML_CONFIDENCE_THRESHOLD`).
  - `nms_iou_threshold`: Default **`0.45`** (dapat diatur via `.env` `ML_NMS_IOU_THRESHOLD`).
  - Koordinat bounding box unpad dan di-rescale kembali ke ukuran asli gambar sumber (`image_width`, `image_height`) dalam integer pixel clamped.

---

## 4. Dataset & Riwayat Eksperimen

### Dataset
- **Sumber:** Roboflow (`insurance-slszr/car-dents-0xzs9` versi 3).
- **Jumlah Citra Unik:** 7.258 citra.
- **Distribusi Split:**
  - Training: 5.080 citra (70%)
  - Validation: 1.088 citra (15%)
  - Test: 1.090 citra (15%)

### Riwayat Training
| Eksperimen | Inisialisasi | Konfigurasi Utama | mAP@50 | Precision | Recall | F1-Score |
|---|---|---|---:|---:|---:|---:|
| Baseline | `yolov8n.pt` | 3 epoch, `augment=False` | 59.47% | - | - | - |
| Tuned v1 | `yolov8n.pt` | 20 epoch, AdamW, lr0 = 0.001 | 83.67% | - | - | - |
| **Optimized v2 (Final)** | Tuned v1 best | 20 epoch tambahan, AdamW, lr0 = 0.0005, Cosine LR, close_mosaic = 10 | **84.34%** | **82.52%** | **75.92%** | **79.08%** |

---

## 5. Keterbatasan & Batasan Domain (Limitations & Ethical Considerations)
1. **Domain Shift:** Dataset bersumber dari proyek kerusakan kendaraan umum. Akurasi pada komponen khusus motor (misal: spakbor melengkung, batok lampu) memerlukan validasi lapangan lanjutan.
2. **Cakupan Pemeriksaan:** Model hanya mendeteksi anomali visual pada bodi luar. Model **TIDAK** dapat mendiagnosis mesin internal, rangka tersembunyi, sistem kelistrikan, riwayat banjir, atau keabsahan dokumen kendaraan (STNK/BPKB).
3. **Penyajian Hasil:** Hasil inferensi adalah alat bantu transparansi penjual dan referensi komparasi pembeli, bukan sertifikat appraisal mutlak atau jaminan harga transaksi final.

