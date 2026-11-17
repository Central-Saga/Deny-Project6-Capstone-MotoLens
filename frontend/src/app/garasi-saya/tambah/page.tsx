'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ScanLine,
} from 'lucide-react';
import { motorcycleService } from '@/services/motorcycleService';
import { ApiClientError } from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/formatters';

function PublishListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const paramInspectionId = searchParams.get('inspection_id') || '';
  const paramSuggestedPrice = searchParams.get('suggested_price') || '';

  const [inspectionId, setInspectionId] = useState<string>(paramInspectionId);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [sellerPrice, setSellerPrice] = useState<string>(paramSuggestedPrice);
  const [locationAddress, setLocationAddress] =
    useState<string>('Denpasar Barat, Bali');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      await motorcycleService.create({
        inspection_id: Number(inspectionId),
        title,
        description: description.trim() || undefined,
        seller_price: Number(sellerPrice),
        location_address: locationAddress,
      });
      router.push('/garasi-saya');
    } catch (err) {
      if (err instanceof ApiClientError) {
        const firstErr = err.errors
          ? Object.values(err.errors).flat()[0]
          : null;
        setErrorMsg(firstErr || err.message);
      } else {
        setErrorMsg('Gagal menerbitkan iklan motor.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/garasi-saya"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Garasi Saya</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Terbitkan Iklan Motor Baru
          </h1>
          <p className="text-xs text-slate-600">
            Setiap listing wajib memiliki sertifikat inspeksi AI (
            <code>inspection_id</code>). Iklan baru akan berstatus{' '}
            <strong>pending moderation</strong> hingga disetujui Admin.
          </p>
        </div>

        {/* Shortcut to Inspect Simulator if no inspection_id yet */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-indigo-950">
            <p className="font-bold">Belum Memiliki ID Sertifikat Inspeksi AI?</p>
            <p className="text-indigo-800">
              Jalankan Simulasi Inspeksi AI terlebih dahulu untuk mendapatkan ID
              sertifikat otomatis.
            </p>
          </div>
          <Link
            href="/inspect-simulator"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Buka Inspeksi AI</span>
          </Link>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              ID Sertifikat Inspeksi AI (`inspection_id`)
            </label>
            <input
              type="number"
              required
              min={1}
              value={inspectionId}
              onChange={(e) => setInspectionId(e.target.value)}
              placeholder="Contoh: 1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Judul Iklan Motor
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Honda PCX 160 ABS 2023 Terawat Istimewa"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Harga Jual yang Diminta (Rp)
              </label>
              <input
                type="number"
                required
                min={500000}
                value={sellerPrice}
                onChange={(e) => setSellerPrice(e.target.value)}
                placeholder="Contoh: 28500000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
              {paramSuggestedPrice && (
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Rekomendasi AI: {formatCurrency(Number(paramSuggestedPrice))}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Lokasi Motor di Bali
              </label>
              <input
                type="text"
                required
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Contoh: Denpasar Barat, Bali"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Deskripsi & Kelengkapan Kendaraan
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan riwayat servis rutin, kelengkapan STNK/BPKB, kunci cadangan, dll."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menerbitkan Iklan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Terbitkan Listing Motor</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PublishListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <PublishListingContent />
    </Suspense>
  );
}
