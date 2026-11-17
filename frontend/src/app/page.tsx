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
  const [showFilters, setShowFilters] = useState<boolean>(true);

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
    <div className="space-y-8 pb-10">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  YOLOv8n ONNX Object Detection • Explainable Price Breakdown
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Beli Motor Bekas di Bali dengan{' '}
                <span className="text-indigo-400">
                  Transparansi Inspeksi AI
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Setiap unit dilengkapi sertifikat deteksi kerusakan visual bodi
                luar (<em>Scratch</em>, <em>Dent</em>, <em>Accident</em>) serta
                rincian depresiasi harga yang jujur dan transparan.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/inspect-simulator"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg transition"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Coba Simulasi Inspeksi AI</span>
                </Link>
                <Link
                  href="/garasi-saya/tambah"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold transition"
                >
                  <span>Jual Motor Anda</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <p className="text-xs text-slate-400">Deteksi Objek Visual</p>
                <p className="text-xl font-extrabold text-white">3 Kelas AI</p>
                <p className="text-[11px] text-indigo-300">
                  Scratch, Dent & Accident
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <p className="text-xs text-slate-400">Akurasi Model ONNX</p>
                <p className="text-xl font-extrabold text-emerald-400">
                  84.34% mAP
                </p>
                <p className="text-[11px] text-slate-400">
                  YOLOv8n Optimized v2
                </p>
              </div>
              <div className="col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    Indikator Harga Objektif (Good Deal, Fair Price, Overpriced)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Bandingkan harga permintaan penjual terhadap taksiran sistem
                    secara instan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog & Filter Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Search & Sort Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari motor (contoh: PCX 160, NMAX, Vario, Denpasar)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>{showFilters ? 'Sembunyikan Filter' : 'Filter Katalog'}</span>
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
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="newest">Terbaru Ditambahkan</option>
                <option value="price_asc">Harga Terendah → Tertinggi</option>
                <option value="price_desc">Harga Tertinggi → Terendah</option>
              </select>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Reset semua filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Comprehensive Filter Grid */}
          {showFilters && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
              {/* Brand */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Merek Motor
                </label>
                <select
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    setModelName('');
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Model Referensi
                </label>
                <select
                  value={modelName}
                  onChange={(e) => {
                    setModelName(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Indikator Harga AI
                </label>
                <select
                  value={priceLabel}
                  onChange={(e) => {
                    setPriceLabel(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="">Semua Label Harga</option>
                  <option value="good_deal">Good Deal (Di Bawah Pasar)</option>
                  <option value="fair_price">Fair Price (Harga Wajar)</option>
                  <option value="overpriced">Overpriced (Di Atas Pasar)</option>
                </select>
              </div>

              {/* Condition Grade */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Grade Kondisi Visual
                </label>
                <select
                  value={conditionGrade}
                  onChange={(e) => {
                    setConditionGrade(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Lokasi di Bali
                </label>
                <select
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Count */}
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <p>
            Menampilkan <strong>{motorcycles.length}</strong> dari total{' '}
            <strong>{meta.total}</strong> unit motor bekas terverifikasi
          </p>
          <p className="hidden sm:block">
            Klik ikon timbangan pada kartu untuk membandingkan 2–3 motor
          </p>
        </div>

        {/* Catalog Grid */}
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
            description="Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh unit motor bekas yang tersedia."
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
          <div className="pt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <span className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200">
              Halaman {meta.current_page} dari {meta.last_page}
            </span>

            <button
              type="button"
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
