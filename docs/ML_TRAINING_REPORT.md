# Laporan Training & Evaluasi Model — MotoLens YOLOv8n (`model_damage.onnx`)

Dokumen ini merangkum seluruh konfigurasi dataset, statistik eksplorasi data (EDA), hyperparameter eksperimen, metrik evaluasi per kelas, spesifikasi ekspor ONNX, serta panduan pengunduhan dan verifikasi checksum SHA-256 yang diekstrak langsung dari output eksekusi [`ML/MotoLens_YOLOv8_Training.ipynb`](../ML/MotoLens_YOLOv8_Training.ipynb).

> **Mengapa Dokumen Ini Dibuat?**  
> Sesuai praktik terbaik MLOps (GitHub Issue #3), output eksekusi biner dan log panjang pada file Jupyter Notebook (`ML/MotoLens_YOLOv8_Training.ipynb`) telah dibersihkan (*stripped* hingga `< 20 KB`, `0 cell output`) menggunakan `nbstripout` agar repositori tetap ringan dan mudah di-*diff*. Seluruh hasil kuantitatif training diawetkan secara permanen di dokumen ini dan di [`ML/evaluation/metrics.json`](../ML/evaluation/metrics.json).

---

## 1. Identitas & Checksum Artefak Model Kanonis

| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **Nama Artefak** | `model_damage.onnx` |
| **Versi Model Produksi** | `optimized_v2` (Tahap 3 Fine-Tuning Cosine Annealing LR) |
| **Lokasi Kanonis Lokal** | `backend/storage/app/ml/model_damage.onnx` |
| **Distribusi Rilis** | GitHub Release **`v1.0.1`** (`model_damage.onnx`) |
| **Ukuran File Biner** | `12.775.147` bytes (~12,18 MB) |
| **SHA-256 Checksum** | `22ec0d55bdb32939ae8ca5cd4bb1207ab8576f4775f8c5e32359ceb81ab49edd` |
| **Arsitektur Dasar** | Ultralytics YOLOv8n (`yolov8n.pt`, Object Detection, `nc=3`) |
| **Parameter & Kompleksitas** | 129 layers (73 fused), `3.011.433` params (`3.133.193` fused), `8,2 GFLOPs` (`8,6 GFLOPs` fused) |
| **Lingkungan Training** | Ultralytics `8.4.211`, Python `3.13.16`, PyTorch `2.14.1+cu130`, GPU NVIDIA Tesla T4 (14.913 MiB), `SEED=42` |
| **Format Ekspor ONNX** | `onnx 1.23.2` (Opset 18) + `onnxslim 0.1.99` (`simplify=True`) |

---

## 2. Dataset, Pembersihan Data & Statistik Bounding Box

### 2.1 Sumber & Pembersihan Dataset
- **Sumber Dataset:** Roboflow (`insurance-slszr/car-dents-0xzs9`, Version 3 — format YOLOv8).
- **Pembersihan & Validasi Otomatis (Cell 2):**
  - Pemeriksaan integritas file citra (`PIL.Image.open`) dan ketersediaan file anotasi `.txt`.
  - Konversi otomatis anotasi poligon ke bounding box standar YOLO `(x_center, y_center, box_width, box_height)` ternormalisasi `[0.0, 1.0]`.
  - **Total Gambar Unik Bersih:** `7.258` citra.
  - **Total Anotasi Objek (Bounding Box):** `7.777` objek.
  - **Data Rusak / Duplikat Dihapus:** `0` file corrupt, `0` baris duplikat.

### 2.2 Distribusi Kelas Kerusakan (`nc = 3`)
| Class ID | Nama Kelas | Jumlah Objek (Total Dataset) | Proporsi | Aturan Depresiasi Visual MotoLens (PRD Bab 4.4) |
| :---: | :--- | ---: | ---: | :--- |
| `0` | **`Accident`** | 2.028 | 26,08% | `-7,5%` per titik deteksi (maksimal `-20,0%`) |
| `1` | **`Dent`** | 3.564 | 45,83% | `-5,0%` per titik deteksi (maksimal `-15,0%`) |
| `2` | **`Scratch`** | 2.185 | 28,10% | `-2,5%` per titik deteksi (maksimal `-10,0%`) |
| **Total** | **3 Kelas** | **7.777** | **100,00%** | Akumulasi penalti visual dibatasi aturan plafon per kelas |

### 2.3 Statistik Deskriptif Ukuran Bounding Box Ternormalisasi (`7.777` Anotasi)
| Statistik | `box_width` (Lebar Ternormalisasi) | `box_height` (Tinggi Ternormalisasi) |
| :--- | ---: | ---: |
| **Count** | 7.777 | 7.777 |
| **Mean** | 0,449381 | 0,448863 |
| **Std Dev** | 0,224898 | 0,217062 |
| **Min** | 0,018750 | 0,019314 |
| **25% (Q1)** | 0,271987 | 0,278528 |
| **50% (Median)** | 0,412500 | 0,419531 |
| **75% (Q3)** | 0,596414 | 0,595313 |
| **Max** | 1,000000 | 1,000000 |

### 2.4 Pembagian Split Bebas Kebocoran Data (*Leakage-Free Image Split 70/15/15*)
Pengacakan dilakukan pada level **citra unik** (`SEED = 42`) sebelum menyalin citra dan label ke struktur bersih `/content/motolens_clean_70_15_15`:
- **Training Set (70%):** `5.080` citra (`5.432` objek) — digunakan untuk pembaruan gradien bobot model.
- **Validation Set (15%):** `1.088` citra (`1.158` objek: `Accident`=290, `Dent`=554, `Scratch`=314) — digunakan untuk pemantauan epoch & pemilihan `best.pt`.
- **Test Set (15%):** `1.090` citra (`1.187` objek: `Accident`=313 pada 310 citra, `Dent`=540 pada 509 citra, `Scratch`=334 pada 306 citra) — digunakan satu kali untuk evaluasi akhir objektif.

---

## 3. Konfigurasi Hyperparameter & Riwayat 3 Eksperimen Training

| Parameter / Konfigurasi | Eksperimen 1: **Baseline** (`motolens_baseline`) | Eksperimen 2: **Tuned v1** (`motolens_tuned`) | Eksperimen 3: **Optimized v2** (`motolens_optimized_v2` — **Produksi**) |
| :--- | :--- | :--- | :--- |
| **Inisialisasi Bobot** | `yolov8n.pt` (COCO Pretrained) | `yolov8n.pt` (COCO Pretrained) | `runs/detect/motolens_tuned/weights/best.pt` |
| **Jumlah Epoch** | 3 epoch | 20 epoch (`patience=7`) | +20 epoch lanjutan (total 40 epoch) |
| **Resolusi Input (`imgsz`)** | `640 x 640` | `640 x 640` | `640 x 640` |
| **Batch Size & Workers** | `batch=32`, `workers=2`, `amp=True` | `batch=32`, `workers=2`, `amp=True` | `batch=32`, `workers=2`, `amp=True` |
| **Optimizer** | Auto (`AdamW`, `lr=0.001429`, `momentum=0.9`) | `AdamW` (`momentum=0.937`, `weight_decay=0.0005`) | `AdamW` (`momentum=0.937`, `weight_decay=0.0005`) |
| **Learning Rate (`lr0` -> `lrf`)** | `lr0=0.001429`, `lrf=0.01` | `lr0=0.001`, `lrf=0.01`, Linear LR | `lr0=0.0005`, `lrf=0.01`, **Cosine LR (`cos_lr=True`)** |
| **Strategi Augmentasi** | `augment=False` | Default YOLO + Albumentations, `close_mosaic=10` | Default YOLO + Albumentations, **`close_mosaic=10`** |
| **Loss Akhir (Epoch Terakhir)** | `box=1.223`, `cls=1.629`, `dfl=1.593` | `box=0.7751`, `cls=0.7261`, `dfl=1.211` | `box=0.6948`, `cls=0.5598`, `dfl=1.150` |
| **Durasi Training (Tesla T4)** | 0,053 jam (~3,2 menit) | 0,360 jam (~21,6 menit) | 0,372 jam (~22,3 menit) |

---

## 4. Hasil Evaluasi Kuantitatif (Validation Set & Test Set)

### 4.1 Perbandingan Metrik Agregat pada Test Set (15% — `1.090` Citra, `1.187` Objek)
| Tahap Eksperimen | Precision (P) | Recall (R) | F1-Score | mAP@50 | mAP@50-95 | Status Artefak |
| :--- | ---: | ---: | ---: | ---: | ---: | :--- |
| **1. Baseline (3 Epochs)** | 63,35% (`0.6335`) | 54,17% (`0.5417`) | 58,40% (`0.5840`) | 59,47% (`0.5947`) | 40,19% (`0.4019`) | Eksperimen Awal |
| **2. Tuned v1 (20 Epochs, AdamW)** | 84,04% (`0.8404`) | 74,14% (`0.7414`) | 78,78% (`0.7878`) | 83,67% (`0.8367`) | 65,58% (`0.6558`) | Backup (`model_damage_v1_83pct.onnx`) |
| **3. Optimized v2 (+20 Epochs, Cosine LR)** | **82,52%** (`0.8252`) | **75,92%** (`0.7592`) | **79,08%** (`0.7908`) | **84,34%** (`0.8434`) | **67,54%** (`0.6754`) | **Produksi (`model_damage.onnx`)** |

### 4.2 Rincian Metrik Per Kelas pada Test Set (`1.090` Citra, `1.187` Objek)

#### A. Model Produksi: **Optimized v2 (`model_damage.onnx`)** — Test Set
| Kelas | Jumlah Citra Uji | Jumlah Instans Objek | Precision (P) | Recall (R) | mAP@50 | mAP@50-95 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Semua Kelas (`all`)** | **1.090** | **1.187** | **0,825 (82,52%)** | **0,759 (75,92%)** | **0,843 (84,34%)** | **0,675 (67,54%)** |
| `Accident` (Class 0) | 310 | 313 | 0,789 (78,9%) | 0,741 (74,1%) | 0,825 (82,5%) | 0,655 (65,5%) |
| `Dent` (Class 1) | 509 | 540 | 0,869 (86,9%) | 0,789 (78,9%) | 0,871 (87,1%) | 0,687 (68,7%) |
| `Scratch` (Class 2) | 306 | 334 | 0,817 (81,7%) | 0,747 (74,7%) | 0,833 (83,3%) | 0,684 (68,4%) |

*(Kecepatan inferensi pada Test Set dengan Tesla T4: `1,3 ms` preprocess, `4,2 ms` inference, `1,5 ms` postprocess per citra).*

#### B. Model Tahap 2: **Tuned v1** — Test Set
| Kelas | Jumlah Citra Uji | Jumlah Instans Objek | Precision (P) | Recall (R) | mAP@50 | mAP@50-95 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Semua Kelas (`all`)** | **1.090** | **1.187** | **0,840 (84,04%)** | **0,741 (74,14%)** | **0,837 (83,67%)** | **0,656 (65,58%)** |
| `Accident` (Class 0) | 310 | 313 | 0,819 | 0,709 | 0,820 | 0,634 |
| `Dent` (Class 1) | 509 | 540 | 0,869 | 0,781 | 0,868 | 0,672 |
| `Scratch` (Class 2) | 306 | 334 | 0,833 | 0,733 | 0,823 | 0,662 |

#### C. Model Tahap 1: **Baseline (3 Epochs)** — Test Set
| Kelas | Jumlah Citra Uji | Jumlah Instans Objek | Precision (P) | Recall (R) | mAP@50 | mAP@50-95 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Semua Kelas (`all`)** | **1.090** | **1.187** | **0,633 (63,35%)** | **0,542 (54,17%)** | **0,595 (59,47%)** | **0,402 (40,19%)** |
| `Accident` (Class 0) | 310 | 313 | 0,538 | 0,489 | 0,514 | 0,314 |
| `Dent` (Class 1) | 509 | 540 | 0,678 | 0,642 | 0,695 | 0,477 |
| `Scratch` (Class 2) | 306 | 334 | 0,685 | 0,494 | 0,575 | 0,415 |

### 4.3 Rincian Metrik Per Kelas pada Validation Set (`1.088` Citra, `1.158` Objek — Optimized v2)
| Kelas | Jumlah Citra Val | Jumlah Instans Objek | Precision (P) | Recall (R) | mAP@50 | mAP@50-95 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Semua Kelas (`all`)** | **1.088** | **1.158** | **0,824** | **0,790** | **0,845** | **0,683** |
| `Accident` (Class 0) | 290 | 290 | 0,791 | 0,769 | 0,822 | 0,642 |
| `Dent` (Class 1) | 531 | 554 | 0,853 | 0,807 | 0,867 | 0,713 |
| `Scratch` (Class 2) | 301 | 314 | 0,826 | 0,793 | 0,847 | 0,692 |

---

## 5. Spesifikasi Input/Output Tensor ONNX Runtime

- **Input Tensor (`images`):**
  - Shape: `(1, 3, 640, 640)` (`float32`, layout `BCHW`, urutan kanal `RGB`).
  - Preprocessing: Letterbox resize ke `640x640` dengan warna padding `(114, 114, 114)` dan normalisasi piksel `1/255.0` (`[0.0, 1.0]`).
- **Output Tensor (`output0`):**
  - Shape: `(1, 7, 8400)` (`float32`).
  - Dimensi 7 kanal per kandidat box: `[cx, cy, w, h, score_Accident, score_Dent, score_Scratch]`.
  - Postprocessing di [`backend/scripts/yolo_infer.py`](../backend/scripts/yolo_infer.py): Filtering ambang batas `confidence_threshold = 0.35`, Non-Maximum Suppression `nms_iou_threshold = 0.45`, serta konversi balik koordinat letterbox ke dimensi piksel asli citra (`[x1, y1, x2, y2]`).

---

## 6. Cara Mengunduh Model, Reproduksi dari Notebook & Verifikasi SHA-256

File biner `model_damage.onnx` (~12,18 MB) **tidak disimpan di dalam Git index** (`.gitignore` mengabaikan `*.onnx`) untuk menjaga ukuran repositori tetap ramping.

### 6.1 Mengunduh `model_damage.onnx` dari GitHub Release `v1.0.1`

Letakkan file hasil unduhan di lokasi kanonis **`backend/storage/app/ml/model_damage.onnx`**:

```bash
# Opsi A — Menggunakan GitHub CLI (gh):
gh release download v1.0.1 \
  --repo Central-Saga/Deny-Project6-Capstone-MotoLens \
  --pattern "model_damage.onnx" \
  --dir backend/storage/app/ml \
  --clobber

# Opsi B — Menggunakan curl (Linux / macOS / Git Bash / PowerShell):
curl.exe -fL \
  https://github.com/Central-Saga/Deny-Project6-Capstone-MotoLens/releases/download/v1.0.1/model_damage.onnx \
  -o backend/storage/app/ml/model_damage.onnx
```

### 6.2 Memverifikasi Checksum SHA-256

Pastikan output hash SHA-256 bernilai **`22ec0d55bdb32939ae8ca5cd4bb1207ab8576f4775f8c5e32359ceb81ab49edd`** (sama dengan `ML_MODEL_SHA256` di `docker-compose.yml` dan `.env.example`):

```powershell
# Di Windows PowerShell:
(Get-FileHash backend/storage/app/ml/model_damage.onnx -Algorithm SHA256).Hash.ToLower()
```

```bash
# Di Linux / macOS / Runner Ubuntu CI:
echo "22ec0d55bdb32939ae8ca5cd4bb1207ab8576f4775f8c5e32359ceb81ab49edd  backend/storage/app/ml/model_damage.onnx" | sha256sum -c -
```

### 6.3 Menghasilkan Ulang (`Reproduce`) Model dari Notebook Training
1. Buka [`ML/MotoLens_YOLOv8_Training.ipynb`](../ML/MotoLens_YOLOv8_Training.ipynb) di Google Colab (runtime GPU T4) atau workstation lokal dengan GPU CUDA.
2. Set environment variable `ROBOFLOW_API_KEY` dengan API key Roboflow Anda untuk mengunduh dataset `insurance-slszr/car-dents-0xzs9` v3.
3. Jalankan seluruh cell secara berurutan (Cell 0 hingga Cell 8):
   - Cell 7 mengekspor checkpoint terbaik `runs/detect/motolens_optimized_v2/weights/best.pt` menjadi `model_damage.onnx` (`best_opt_v2.export(format="onnx", imgsz=640, simplify=True)`).
4. Salin `model_damage.onnx` yang dihasilkan ke `backend/storage/app/ml/model_damage.onnx` dan perbarui `ML_MODEL_SHA256` jika Anda melakukan training ulang dengan seed/epoch berbeda.
