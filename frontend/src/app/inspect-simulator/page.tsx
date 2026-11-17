'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Cpu,
  Globe,
  Loader2,
  ScanLine,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import type { MotorcycleInspection } from '@/types/inspection';
import type { MotorcycleModelRef, TaxStatus } from '@/types/motorcycle';
import { motorcycleService } from '@/services/motorcycleService';
import { inspectionService } from '@/services/inspectionService';
import { ApiClientError } from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { BoundingBoxViewer } from '@/components/features/BoundingBoxViewer';
import { PriceBadge } from '@/components/shared/PriceBadge';
import { ConditionBadge } from '@/components/shared/ConditionBadge';
import { VerificationBadge } from '@/components/shared/VerificationBadge';
import { DamageSummaryPills } from '@/components/shared/DamageSummaryPills';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export default function InspectSimulatorPage() {
  const { isAuthenticated } = useAuth();

  const [models, setModels] = useState<MotorcycleModelRef[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [year, setYear] = useState<number>(2022);
  const [odometerKm, setOdometerKm] = useState<number>(15000);
  const [taxStatus, setTaxStatus] = useState<TaxStatus>('active');
  const [sellerPrice, setSellerPrice] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<MotorcycleInspection | null>(null);

  useEffect(() => {
    motorcycleService
      .getModels()
      .then((res) => {
        const list = res.data || [];
        setModels(list);
        if (list.length > 0) {
          setSelectedModelId(String(list[0].id));
        }
      })
      .catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRunInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!photoFile) {
      setErrorMsg('Silakan pilih file foto bodi motor terlebih dahulu.');
      return;
    }

    if (!selectedModelId) {
      setErrorMsg('Silakan pilih model referensi motor.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await inspectionService.inspect({
        photo: photoFile,
        motorcycle_model_id: Number(selectedModelId),
        year: Number(year),
        odometer_km: Number(odometerKm),
        tax_status: taxStatus,
        seller_price: sellerPrice ? Number(sellerPrice) : undefined,
        source_type: 'web_upload',
      });
      setResult(res.data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        const firstFieldErr = err.errors
          ? Object.values(err.errors).flat()[0]
          : null;
        setErrorMsg(firstFieldErr || err.message);
      } else {
        setErrorMsg('Gagal menjalankan inferensi AI YOLOv8.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedModel = models.find((m) => String(m.id) === selectedModelId);
  const pb = result?.price_breakdown;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
            <Globe className="w-3.5 h-3.5" />
            <span>Mode: Simulasi Inspeksi Web (source_type = web_upload)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>YOLOv8n ONNX Runtime Inference</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Simulasi Inspeksi Kerusakan Bodi & Taksiran Harga AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Unggah foto bodi motor untuk menguji deteksi objek YOLOv8 (
          <em>Scratch</em>, <em>Dent</em>, <em>Accident</em>) dan melihat
          perhitungan <em>Explainable Price Breakdown</em> secara langsung.
          Catatan: Hasil unggahan browser ditandai jujur sebagai{' '}
          <strong>Simulasi Inspeksi Web (`web_upload`)</strong>, bukan{' '}
          <em>Camera Verified</em> aplikasi Android.
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <ScanLine className="w-12 h-12 text-indigo-600 mx-auto" />
          <h2 className="text-lg font-extrabold text-slate-900">
            Login Diperlukan untuk Menjalankan Inferensi YOLOv8
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Endpoint <code>POST /api/v1/motorcycles/inspect</code> dilindungi
            oleh autentikasi Laravel Sanctum dan rate limiter. Gunakan tombol
            Demo Login untuk mencoba dalam 1 klik.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
          >
            <span>Masuk dengan Akun Demo / Member</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Upload & Vehicle Specs */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleRunInspection}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
            >
              <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                1. Parameter Kendaraan & Foto Bodi
              </h2>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Photo Upload Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Foto Bodi Motor (JPEG/PNG/WebP, Maks 10MB)
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-5 cursor-pointer bg-slate-50/70 transition text-center">
                  {previewUrl ? (
                    <div className="space-y-2 w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Preview Foto Motor"
                        className="h-44 w-full object-contain rounded-xl mx-auto bg-slate-900"
                      />
                      <p className="text-xs font-semibold text-indigo-600">
                        Klik untuk mengganti foto ({photoFile?.name})
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <UploadCloud className="w-9 h-9 text-indigo-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">
                        Klik untuk memilih foto bodi motor
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Pastikan pencahayaan cukup dan bodi samping terlihat
                        jelas
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reference Model */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Model Referensi Motor
                </label>
                <select
                  required
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.model_name} ({m.engine_cc}cc) — Standar:{' '}
                      {formatCurrency(m.standard_price)}
                    </option>
                  ))}
                </select>
                {selectedModel && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Harga standar pasar: {formatCurrency(selectedModel.standard_price)}
                  </p>
                )}
              </div>

              {/* Year & Odometer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tahun Perakitan
                  </label>
                  <input
                    type="number"
                    required
                    min={1995}
                    max={2026}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={500000}
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Tax Status & Optional Seller Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Status Pajak STNK
                  </label>
                  <select
                    value={taxStatus}
                    onChange={(e) => setTaxStatus(e.target.value as TaxStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="active">Aktif (Hidup)</option>
                    <option value="expired">Pajak Mati (Expired)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Rencana Harga Jual (Opsional)
                  </label>
                  <input
                    type="number"
                    min={500000}
                    value={sellerPrice}
                    onChange={(e) => setSellerPrice(e.target.value)}
                    placeholder="Contoh: 24500000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menjalankan Inferensi YOLOv8 ONNX...</span>
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4" />
                    <span>Jalankan Inspeksi AI Sekarang</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Result Panel */}
          <div className="lg:col-span-7 space-y-6">
            {!result ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Hasil Deteksi YOLOv8 & Kalkulasi Harga Akan Tampil di Sini
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Unggah foto motor di panel sebelah kiri dan klik{' '}
                  <strong>Jalankan Inspeksi AI Sekarang</strong> untuk memproses
                  citra melalui model <code>model_damage.onnx</code>.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <BoundingBoxViewer
                  rawImageUrl={
                    result.raw_photo_url || result.raw_image_url || previewUrl
                  }
                  annotatedImageUrl={
                    result.annotated_photo_url ||
                    result.annotated_image_url ||
                    previewUrl
                  }
                  imageWidth={result.image_width}
                  imageHeight={result.image_height}
                  detections={result.detections_json || result.detections || []}
                  title={`Hasil Simulasi Inspeksi — ${result.certificate_number}`}
                />

                {/* Result Summary & Price Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-indigo-600">
                        Sertifikat Simulasi #{result.certificate_number}
                      </p>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        Rincian Hasil Deteksi & Estimasi Harga
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <VerificationBadge sourceType={result.source_type} />
                      {pb?.price_label && <PriceBadge label={pb.price_label} />}
                      {pb?.condition_grade && (
                        <ConditionBadge grade={pb.condition_grade} />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <p className="text-xs font-bold text-slate-700">
                        Deteksi Anomali Visual
                      </p>
                      <DamageSummaryPills
                        scratch={result.scratch_count}
                        dent={result.dent_count}
                        accident={result.accident_count}
                      />
                      <p className="text-xs text-slate-600">
                        Total Penalti Visual:{' '}
                        <strong className="text-rose-600">
                          -{result.damage_penalty_percent}%
                        </strong>{' '}
                        • Waktu Inferensi:{' '}
                        <strong>{result.inference_time_ms ?? 45} ms</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-950 text-white space-y-1.5">
                      <p className="text-xs text-indigo-300">
                        Estimasi Harga Wajar MotoLens AI
                      </p>
                      <p className="text-2xl font-extrabold">
                        {formatCurrency(result.ml_predicted_price)}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Harga Dasar Depresiasi:{' '}
                        {formatCurrency(result.base_depreciated_price)}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Breakdown Table */}
                  {pb && (
                    <div className="space-y-2 text-xs pt-2">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">
                          Harga Standar Referensi
                        </span>
                        <span className="font-bold">
                          {formatCurrency(pb.standard_price)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">
                          Depresiasi Usia ({pb.vehicle_age_years ?? 0} thn / -
                          {pb.age_depreciation_percent ?? 0}%)
                        </span>
                        <span className="text-rose-600 font-semibold">
                          - {formatCurrency(pb.age_depreciation_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">
                          Penalti Odometer ({formatNumber(odometerKm)} km)
                        </span>
                        <span className="text-rose-600 font-semibold">
                          - {formatCurrency(pb.odometer_penalty)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">
                          Penalti Pajak ({taxStatus})
                        </span>
                        <span className="text-rose-600 font-semibold">
                          - {formatCurrency(pb.tax_penalty)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Proceed to Publish Listing Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">
                      Ingin menerbitkan iklan motor ini menggunakan sertifikat
                      inspeksi #{result.id}?
                    </p>
                    <Link
                      href={`/garasi-saya/tambah?inspection_id=${result.id}&suggested_price=${result.ml_predicted_price}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition"
                    >
                      <span>Lanjut Terbitkan Iklan</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
