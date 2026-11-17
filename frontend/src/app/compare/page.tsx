'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Scale,
  Trash2,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { MotorcycleDetail, MotorcycleListItem } from '@/types/motorcycle';
import { motorcycleService } from '@/services/motorcycleService';
import { useCompare } from '@/hooks/useCompare';
import { PriceBadge } from '@/components/shared/PriceBadge';
import { ConditionBadge } from '@/components/shared/ConditionBadge';
import { VerificationBadge } from '@/components/shared/VerificationBadge';
import { DamageSummaryPills } from '@/components/shared/DamageSummaryPills';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export default function ComparePage() {
  const { items, removeFromCompare, clearCompare, toggleCompare } =
    useCompare();

  const [comparedData, setComparedData] = useState<MotorcycleDetail[]>([]);
  const [catalogSuggestions, setCatalogSuggestions] = useState<
    MotorcycleListItem[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async () => {
    const ids = items.map((i) => i.id);
    if (ids.length < 2) {
      setComparedData([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await motorcycleService.compare(ids);
      setComparedData(res.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat komparasi unit motor.'
      );
    } finally {
      setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  useEffect(() => {
    motorcycleService
      .getCatalog({ per_page: 6, sort: 'newest' })
      .then((res) => setCatalogSuggestions(res.data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Scale className="w-7 h-7 text-indigo-600" />
            <span>Komparasi Motor Bekas (2–3 Unit)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Bandingkan spesifikasi, hasil deteksi kerusakan AI, dan selisih
            harga taksiran berdampingan secara objektif.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCompare}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Kosongkan Pilihan ({items.length})</span>
          </button>
        )}
      </div>

      {/* Selected Slots Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((slotIdx) => {
          const item = items[slotIdx];
          return (
            <div
              key={slotIdx}
              className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
                item
                  ? 'bg-white border-indigo-200 shadow-xs'
                  : 'bg-slate-100/70 border-dashed border-slate-300'
              }`}
            >
              {item ? (
                <>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-indigo-600">
                      Unit #{slotIdx + 1}
                    </span>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs font-semibold text-slate-600">
                      {formatCurrency(item.seller_price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCompare(item.id)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2.5 text-slate-500 py-1">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Slot Unit #{slotIdx + 1} Kosong</p>
                    <p className="text-[11px]">
                      Pilih dari rekomendasi di bawah atau katalog
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Comparison Table */}
      {items.length < 2 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-2">
          <p className="text-sm font-bold text-amber-950">
            Pilih Minimal 2 Unit Motor untuk Memulai Komparasi
          </p>
          <p className="text-xs text-amber-800">
            Saat ini Anda baru memilih {items.length} unit. Klik tombol{' '}
            <strong>+ Tambah ke Komparasi</strong> pada daftar motor di bawah
            ini.
          </p>
        </div>
      ) : loading ? (
        <div className="py-14 text-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">
            Menyusun tabel perbandingan mendalam dari `/api/v1/motorcycles/compare`...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold text-center">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-48">
                  Atribut Perbandingan
                </th>
                {comparedData.map((m) => (
                  <th key={m.id} className="p-4 align-top">
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          m.main_image_url ||
                          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={m.title}
                        className="w-full h-36 object-cover rounded-xl border border-slate-200"
                      />
                      <p className="text-[11px] font-bold uppercase text-indigo-600">
                        {m.brand} • {m.model_name}
                      </p>
                      <Link
                        href={`/motorcycles/${m.id}`}
                        className="text-sm font-extrabold text-slate-900 hover:text-indigo-600 line-clamp-2 flex items-center gap-1"
                      >
                        <span>{m.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Indikator Harga AI
                </td>
                {comparedData.map((m) => (
                  <td key={m.id} className="p-4">
                    <PriceBadge label={m.price_label} />
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Harga Penjual
                </td>
                {comparedData.map((m) => (
                  <td
                    key={m.id}
                    className="p-4 text-base font-extrabold text-slate-900"
                  >
                    {formatCurrency(m.seller_price)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Estimasi Wajar AI
                </td>
                {comparedData.map((m) => (
                  <td
                    key={m.id}
                    className="p-4 font-bold text-indigo-700 bg-indigo-50/30"
                  >
                    {formatCurrency(m.ml_predicted_price)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Harga Standar Model
                </td>
                {comparedData.map((m) => (
                  <td key={m.id} className="p-4 text-slate-700">
                    {formatCurrency(
                      m.price_breakdown?.standard_price ??
                        m.base_depreciated_price
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Grade Kondisi Visual
                </td>
                {comparedData.map((m) => (
                  <td key={m.id} className="p-4">
                    <ConditionBadge grade={m.condition_grade} />
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Deteksi Kerusakan YOLOv8
                </td>
                {comparedData.map((m) => (
                  <td key={m.id} className="p-4 space-y-1.5">
                    <DamageSummaryPills
                      scratch={
                        m.inspection_certificate?.counts?.scratch ??
                        m.price_breakdown?.detection_counts?.scratch ??
                        0
                      }
                      dent={
                        m.inspection_certificate?.counts?.dent ??
                        m.price_breakdown?.detection_counts?.dent ??
                        0
                      }
                      accident={
                        m.inspection_certificate?.counts?.accident ??
                        m.price_breakdown?.detection_counts?.accident ??
                        0
                      }
                      compact
                    />
                    <p className="text-[11px] text-rose-600 font-semibold">
                      Penalti Visual: -{m.damage_penalty_percent}%
                    </p>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Sumber Inspeksi
                </td>
                {comparedData.map((m) => (
                  <td key={m.id} className="p-4">
                    <VerificationBadge
                      sourceType={
                        m.inspection_certificate?.source_type || m.source_type
                      }
                      isCameraVerified={m.is_camera_verified}
                    />
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Tahun & Kapasitas Mesin
                </td>
                {comparedData.map((m) => (
                  <td key={m.id} className="p-4 font-semibold text-slate-800">
                    Tahun {m.year} • {m.engine_cc} cc ({m.category})
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Jarak Tempuh (Odometer)
                </td>
                {comparedData.map((m) => (
                  <td key={m.id} className="p-4 font-semibold text-slate-800">
                    {formatNumber(m.odometer_km)} km
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Status Pajak STNK
                </td>
                {comparedData.map((m) => (
                  <td key={m.id} className="p-4 font-semibold uppercase">
                    {m.tax_status === 'active'
                      ? 'Aktif (Hidup)'
                      : 'Pajak Mati (Expired)'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Lokasi & Penjual
                </td>
                {comparedData.map((m) => (
                  <td key={m.id} className="p-4 text-slate-700">
                    <p className="font-semibold">{m.location_address}</p>
                    <p className="text-slate-500 text-[11px]">
                      Penjual: {m.seller?.name}
                    </p>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
                  Tindakan
                </td>
                {comparedData.map((m) => (
                  <td key={m.id} className="p-4">
                    <Link
                      href={`/motorcycles/${m.id}`}
                      className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition"
                    >
                      Lihat Sertifikat & Survei
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Add Suggestions from Catalog */}
      {catalogSuggestions.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-base font-extrabold text-slate-900">
            Pilih Cepat Unit Motor untuk Dikomparasi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogSuggestions.map((unit) => {
              const selected = items.some((i) => i.id === unit.id);
              return (
                <div
                  key={unit.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-indigo-600">
                      {unit.brand} • {unit.year}
                    </p>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {unit.title}
                    </p>
                    <p className="text-xs font-extrabold text-slate-700">
                      {formatCurrency(unit.seller_price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toggleCompare({
                        id: unit.id,
                        title: unit.title,
                        brand: unit.brand,
                        model_name: unit.model_name,
                        seller_price: unit.seller_price,
                        main_image_url: unit.main_image_url,
                      })
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                      selected
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {selected ? 'Hapus' : '+ Bandingkan'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
