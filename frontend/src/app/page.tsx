'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ScanLine,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Camera,
  Star,
  Quote,
  Plus,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import type {
  CatalogFilterParams,
  MotorcycleListItem,
  MotorcycleModelRef,
} from '@/types/motorcycle';
import { motorcycleService } from '@/services/motorcycleService';
import { MotorcycleCard } from '@/components/features/MotorcycleCard';
import {
  EmptyState,
  ErrorState,
  SkeletonCard,
} from '@/components/shared/StateFeedback';

const BRANDS = ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'Vespa'];
const BALI_LOCATIONS = [
  'Denpasar',
  'Badung',
  'Kuta',
  'Canggu',
  'Ubud',
  'Gianyar',
  'Tabanan',
  'Jimbaran',
  'Sanur',
];

const CUSTOMER_TESTIMONIALS = [
  {
    id: 1,
    name: 'I Made Wirawan',
    role: 'Pembeli Honda PCX 160 • Denpasar',
    avatar: 'MW',
    rating: 5,
    quote:
      'Sertifikat AI MotoLens menunjukkan titik baret halus di spakbor depan secara akurat sebelum saya survei langsung. Rincian depresiasi harganya jujur dan sangat membantu negosiasi!',
  },
  {
    id: 2,
    name: 'Ni Putu Ayu Lestari',
    role: 'Penjual Vespa Sprint S • Badung',
    avatar: 'PA',
    rating: 5,
    quote:
      'Motor saya langsung mendapat label Good Deal setelah di-scan YOLOv8. Dalam 2 hari langsung ada 3 jadwal survei masuk dari pembeli serius di Canggu tanpa tawar-menawar tidak wajar.',
  },
  {
    id: 3,
    name: 'Bagus Pratama',
    role: 'Pembeli Yamaha NMAX • Gianyar',
    avatar: 'BP',
    rating: 5,
    quote:
      'Fitur komparasi 3 unit dan Explainable Price Breakdown membuat saya paham berapa potongan harga karena pajak atau kilometer tinggi. Pengalaman beli motor bekas paling transparan di Bali.',
  },
  {
    id: 4,
    name: 'Komang Adi Saputra',
    role: 'Penjual Kawasaki W175 • Tabanan',
    avatar: 'KA',
    rating: 5,
    quote:
      'Badge Kamera Terverifikasi membuat calon pembeli percaya bahwa foto motor saya asli tanpa editan. Proses booking survei di Garasi Saya juga sangat rapi dan terjadwal.',
  },
];

export default function CatalogHomePage() {
  const [motorcycles, setMotorcycles] = useState<MotorcycleListItem[]>([]);
  const [models, setModels] = useState<MotorcycleModelRef[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination states
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [year, setYear] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [conditionGrade, setConditionGrade] = useState('');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>(
    'newest'
  );
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
  }>({ current_page: 1, last_page: 1, total: 0 });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    motorcycleService
      .getModels()
      .then((res) => setModels(res.data || []))
      .catch(() => {});
  }, []);

  const fetchCatalog = useCallback(
    async (targetPage: number = page) => {
      setLoading(true);
      setError(null);
      try {
        const params: CatalogFilterParams = {
          search: search.trim() || undefined,
          brand: brand || undefined,
          model: modelName || undefined,
          year: year || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
          price_label: priceLabel || undefined,
          condition_grade: conditionGrade || undefined,
          location: location || undefined,
          sort,
          page: targetPage,
          per_page: 12,
        };

        const res = await motorcycleService.getCatalog(params);
        setMotorcycles(res.data || []);
        setMeta({
          current_page: Number(res.meta?.current_page ?? 1),
          last_page: Number(res.meta?.last_page ?? 1),
          total: Number(res.meta?.total ?? (res.data?.length || 0)),
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat katalog motor bekas.'
        );
      } finally {
        setLoading(false);
      }
    },
    [
      search,
      brand,
      modelName,
      year,
      minPrice,
      maxPrice,
      priceLabel,
      conditionGrade,
      location,
      sort,
      page,
    ]
  );

  useEffect(() => {
    fetchCatalog(page);
  }, [fetchCatalog, page]);

  const handleResetFilters = () => {
    setSearch('');
    setBrand('');
    setModelName('');
    setYear('');
    setMinPrice('');
    setMaxPrice('');
    setPriceLabel('');
    setConditionGrade('');
    setLocation('');
    setSort('newest');
    setPage(1);
  };

  const filteredModels = brand
    ? models.filter((m) => m.brand.toLowerCase() === brand.toLowerCase())
    : models;

  return (
    <div className="bg-slate-50 pb-16">
      {/* ============================================================== */}
      {/* A. DARK AUTOMOTIVE HERO BANNER (Meteors Dealership Style)      */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden bg-zinc-950 text-white pt-12 pb-24 lg:pt-16 lg:pb-28 border-b border-zinc-800">
        {/* Sporty Crimson Red Ambient Glow & Carbon Grid */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[450px] h-[450px] rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Copywriting & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-extrabold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>AI Automotive Showroom Bali • YOLOv8n ONNX</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] text-white">
                Pilih Motor Bekas Impianmu Secara Online dengan{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-amber-400">
                  Transparansi AI
                </span>
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 max-w-2xl leading-relaxed">
                Showroom jual beli motor bekas pertama di Bali yang dilengkapi
                sertifikat deteksi visual bodi luar (<em>Scratch</em>,{' '}
                <em>Dent</em>, <em>Accident</em>) serta kalkulasi depresiasi
                harga yang terbuka dan dapat dipertanggungjawabkan.
              </p>

              {/* Main CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/inspect-simulator"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-black uppercase tracking-wide shadow-lg shadow-red-600/30 transition-all hover:-translate-y-0.5"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Coba Simulasi Inspeksi AI</span>
                </Link>

                <Link
                  href="/garasi-saya/tambah"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-sm font-bold transition-all"
                >
                  <Plus className="w-4 h-4 text-red-500" />
                  <span>Jual Motor Anda</span>
                </Link>
              </div>

              {/* Quick Trust Metrics */}
              <div className="pt-4 grid grid-cols-3 gap-4 max-w-lg border-t border-zinc-800/80">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white">
                    84.34%
                  </p>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Akurasi mAP@50 YOLOv8
                  </p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-red-500">
                    3 Kelas
                  </p>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Scratch, Dent & Accident
                  </p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400">
                    100%
                  </p>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Rincian Harga Transparan
                  </p>
                </div>
              </div>
            </div>

            {/* Right Automotive Showroom Visual Showcase */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-4 shadow-2xl">
                <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=85"
                    alt="Showroom Motor MotoLens"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40" />

                  {/* Simulated AI Bounding Box Overlay */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-950/90 backdrop-blur-md border border-zinc-700 text-[11px] font-bold text-white">
                    <Cpu className="w-3.5 h-3.5 text-red-500" />
                    <span>YOLOv8n ONNX Live Scanner</span>
                  </div>

                  <div className="absolute top-1/3 right-8 border-2 border-amber-400 bg-amber-400/10 rounded-lg px-2.5 py-1 backdrop-blur-[1px]">
                    <span className="text-[10px] font-black uppercase bg-amber-400 text-zinc-950 px-1.5 py-0.5 rounded">
                      Scratch 0.89
                    </span>
                  </div>

                  {/* Bottom HUD Info */}
                  <div className="absolute bottom-3 inset-x-3 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-red-400">
                        Sertifikat Inspeksi AI
                      </p>
                      <p className="text-xs font-extrabold text-white">
                        Grade A (Mulus) • Good Deal
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* B. FLOATING 3-PILLAR VALUE STRIP (Directly Below Hero)         */}
      {/* ============================================================== */}
      <section className="relative z-20 -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl border border-zinc-200/90 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-zinc-100">
          {/* Pillar 1 */}
          <div className="flex items-start gap-4 md:pr-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
              <ScanLine className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                1. Deteksi Visual YOLOv8 ONNX
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Memindai anomali bodi luar (<em>Scratch</em>, <em>Dent</em>, dan{' '}
                <em>Accident</em>) secara presisi dengan akurasi model{' '}
                <strong className="text-zinc-900">84.34% mAP@50</strong>.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="flex items-start gap-4 md:px-6">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
              <Calculator className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                2. Explainable Price Breakdown
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Rumus depresiasi transparan berdasarkan usia tahun, odometer,
                status pajak, dan penalti fisik dibanding harga pasar Bali.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="flex items-start gap-4 md:pl-6">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                3. Verifikasi Kamera & Survei Aman
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Proteksi keaslian foto kamera Android (anti-galeri/manipulasi)
                serta sistem penjadwalan survei fisik/COD langsung dengan penjual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* C. MOST FEATURED MOTORCYCLES & MODERN FILTER BAR               */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 space-y-6">
        {/* Section Title & Brand Quick Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-red-600 block mb-1">
              Showroom Katalog Terverifikasi AI
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Most Featured Motorcycles
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Pilih unit motor bekas berkualitas dengan sertifikat inspeksi AI
              dan indikator harga objektif.
            </p>
          </div>

          {/* Quick Brand Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setBrand('');
                setModelName('');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition shrink-0 ${
                brand === ''
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                  : 'bg-white text-zinc-700 border border-zinc-200 hover:border-red-400'
              }`}
            >
              Semua
            </button>
            {BRANDS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setBrand(b);
                  setModelName('');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition shrink-0 ${
                  brand === b
                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:border-red-400'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter Control Box */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari motor impian (contoh: PCX 160, NMAX, Vario, Vespa, Denpasar)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold transition ${
                  showFilters
                    ? 'bg-zinc-950 text-white border-zinc-950'
                    : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-red-500" />
                <span>
                  {showFilters ? 'Tutup Filter Detail' : 'Filter Spesifikasi'}
                </span>
              </button>

              <select
                aria-label="Urutkan katalog"
                value={sort}
                onChange={(e) => {
                  setSort(
                    e.target.value as 'newest' | 'price_asc' | 'price_desc'
                  );
                  setPage(1);
                }}
                className="px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="newest">Terbaru Ditambahkan</option>
                <option value="price_asc">Harga Terendah → Tertinggi</option>
                <option value="price_desc">Harga Tertinggi → Terendah</option>
              </select>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-red-600 hover:bg-red-50 transition"
                title="Reset semua filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Comprehensive Filter Grid */}
          {showFilters && (
            <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Brand */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Merek Motor
                </label>
                <select
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    setModelName('');
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white"
                >
                  <option value="">Semua Merek</option>
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Model Referensi
                </label>
                <select
                  value={modelName}
                  onChange={(e) => {
                    setModelName(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white"
                >
                  <option value="">Semua Model</option>
                  {filteredModels.map((m) => (
                    <option key={m.id} value={m.model_name}>
                      {m.brand} {m.model_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Label */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Indikator Harga AI
                </label>
                <select
                  value={priceLabel}
                  onChange={(e) => {
                    setPriceLabel(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white"
                >
                  <option value="">Semua Label Harga</option>
                  <option value="good_deal">Good Deal (Di Bawah Pasar)</option>
                  <option value="fair_price">Fair Price (Harga Wajar)</option>
                  <option value="overpriced">Overpriced (Di Atas Pasar)</option>
                </select>
              </div>

              {/* Condition Grade */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Grade Kondisi Visual
                </label>
                <select
                  value={conditionGrade}
                  onChange={(e) => {
                    setConditionGrade(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white"
                >
                  <option value="">Semua Grade Kondisi</option>
                  <option value="mulus">Mulus (Grade A)</option>
                  <option value="lecet_ringan">Lecet Ringan (Grade B)</option>
                  <option value="perlu_perbaikan">
                    Perlu Perbaikan (Grade C)
                  </option>
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Tahun Perakitan
                </label>
                <input
                  type="number"
                  min={2010}
                  max={2026}
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Contoh: 2022"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Lokasi di Bali
                </label>
                <select
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs bg-white"
                >
                  <option value="">Seluruh Bali</option>
                  {BALI_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Harga Minimum (Rp)
                </label>
                <input
                  type="number"
                  step={1000000}
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Contoh: 10000000"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Harga Maksimum (Rp)
                </label>
                <input
                  type="number"
                  step={1000000}
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Contoh: 40000000"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Count Bar */}
        <div className="flex items-center justify-between text-xs text-zinc-600 px-1">
          <p>
            Menampilkan <strong className="text-zinc-900">{motorcycles.length}</strong> dari total{' '}
            <strong className="text-zinc-900">{meta.total}</strong> unit motor bekas terverifikasi
          </p>
          <p className="hidden sm:block font-medium text-zinc-500">
            Klik tombol timbangan di kanan atas kartu untuk membandingkan 2–3 motor
          </p>
        </div>

        {/* Showroom Catalog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchCatalog(page)} />
        ) : motorcycles.length === 0 ? (
          <EmptyState
            title="Tidak Ada Motor yang Sesuai Filter"
            description="Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh unit motor bekas yang tersedia di showroom."
            actionLabel="Reset Semua Filter"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {motorcycles.map((item) => (
              <MotorcycleCard key={item.id} motorcycle={item} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && meta.last_page > 1 && (
          <div className="pt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-xs font-extrabold text-zinc-800 disabled:opacity-40 hover:bg-zinc-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <span className="px-4 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-extrabold">
              Halaman {meta.current_page} / {meta.last_page}
            </span>

            <button
              type="button"
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-xs font-extrabold text-zinc-800 disabled:opacity-40 hover:bg-zinc-100 transition"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* D. WHAT OUR CUSTOMERS SAY (Customer Testimonials Section)      */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-red-600 block">
            What Our Customers Say
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Apa Kata Pembeli & Penjual di Bali
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600">
            Pengalaman nyata bertransaksi motor bekas menggunakan Sertifikat
            Inspeksi Visual AI dan Explainable Price Breakdown MotoLens.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CUSTOMER_TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm hover:shadow-md hover:border-red-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Profile Header */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-zinc-900 to-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {item.avatar}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-zinc-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-red-600 truncate">
                      {item.role}
                    </p>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: item.rating }).map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-xs text-zinc-600 leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <span>Transaksi Terverifikasi</span>
                <Quote className="w-3.5 h-3.5 text-red-500/60" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
