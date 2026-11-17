'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bike,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Check,
  Edit3,
  Heart,
  LayoutDashboard,
  Loader2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Warehouse,
  X,
  ExternalLink,
  ArrowRight,
  Clock,
} from 'lucide-react';
import type { InquiryItem } from '@/types/inquiry';
import type { ListingStatus, MotorcycleListItem } from '@/types/motorcycle';
import { motorcycleService } from '@/services/motorcycleService';
import { inquiryService } from '@/services/inquiryService';
import { ApiClientError } from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { PriceBadge } from '@/components/shared/PriceBadge';
import { MotorcycleCard } from '@/components/features/MotorcycleCard';
import { EmptyState } from '@/components/shared/StateFeedback';
import { formatCurrency, formatDateTimeWita } from '@/utils/formatters';

type GarageTab =
  | 'overview'
  | 'listings'
  | 'seller_inquiries'
  | 'buyer_inquiries'
  | 'favorites';

function GarageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const urlTab = (searchParams.get('tab') as GarageTab) || 'overview';
  const [activeTab, setActiveTab] = useState<GarageTab>(urlTab);

  const [myMotorcycles, setMyMotorcycles] = useState<MotorcycleListItem[]>([]);
  const [sellerInquiries, setSellerInquiries] = useState<InquiryItem[]>([]);
  const [buyerInquiries, setBuyerInquiries] = useState<InquiryItem[]>([]);
  const [favorites, setFavorites] = useState<MotorcycleListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync tab state when URL search param changes
  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // Edit Listing Modal State
  const [editingUnit, setEditingUnit] = useState<MotorcycleListItem | null>(
    null
  );
  const [editPrice, setEditPrice] = useState<string>('');
  const [editStatus, setEditStatus] = useState<ListingStatus>('available');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const loadAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [myRes, sellInqRes, buyInqRes, favRes] = await Promise.all([
        motorcycleService.getMyMotorcycles(1, 30),
        inquiryService.getList('seller', 1, 30),
        inquiryService.getList('buyer', 1, 30),
        motorcycleService.getFavorites(1, 30),
      ]);
      setMyMotorcycles(myRes.data || []);
      setSellerInquiries(sellInqRes.data || []);
      setBuyerInquiries(buyInqRes.data || []);
      setFavorites(favRes.data || []);
    } catch {
      // Ignore partial errors
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      loadAllData();
    }
  }, [authLoading, isAuthenticated, router, loadAllData]);

  const handleOpenEdit = (unit: MotorcycleListItem) => {
    setEditingUnit(unit);
    setEditPrice(String(unit.seller_price));
    setEditStatus((unit.status as ListingStatus) || 'available');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    setSavingEdit(true);
    setBanner(null);

    try {
      await motorcycleService.update(editingUnit.id, {
        seller_price: Number(editPrice),
        status: editStatus,
      });
      setEditingUnit(null);
      setBanner({
        type: 'success',
        text: 'Harga dan status listing motor berhasil diperbarui.',
      });
      loadAllData();
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal memperbarui listing.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteListing = async (id: number) => {
    setBanner(null);
    try {
      await motorcycleService.remove(id);
      setBanner({
        type: 'success',
        text: 'Listing motor berhasil diarsipkan/dihapus.',
      });
      loadAllData();
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal menghapus listing.',
      });
    }
  };

  const handleSellerInquiryAction = async (
    inquiryId: number,
    status: 'accepted' | 'rejected' | 'completed'
  ) => {
    setBanner(null);
    try {
      await inquiryService.updateStatus(inquiryId, status);
      setBanner({
        type: 'success',
        text: `Status survei berhasil diperbarui menjadi "${status}".`,
      });
      loadAllData();
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal memperbarui status survei.',
      });
    }
  };

  const handleBuyerCancelInquiry = async (inquiryId: number) => {
    setBanner(null);
    try {
      await inquiryService.cancel(inquiryId);
      setBanner({
        type: 'success',
        text: 'Pengajuan jadwal survei berhasil dibatalkan.',
      });
      loadAllData();
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal membatalkan jadwal survei.',
      });
    }
  };

  const changeTab = (tab: GarageTab) => {
    setActiveTab(tab);
    router.push(`/garasi-saya?tab=${tab}`, { scroll: false });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mb-2" />
        <p className="text-xs font-semibold text-slate-600">
          Memuat data garasi, jadwal survei & koleksi favorit...
        </p>
      </div>
    );
  }

  // Summary counts
  const pendingModerationCount = myMotorcycles.filter(
    (m) => m.moderation_status === 'pending'
  ).length;
  const activeListingsCount = myMotorcycles.filter(
    (m) => m.status === 'available' && m.moderation_status === 'approved'
  ).length;
  const pendingSellerInquiriesCount = sellerInquiries.filter(
    (i) => i.status === 'pending'
  ).length;

  return (
    <div className="space-y-6">
      {/* Banner Notifikasi Aksi */}
      {banner && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span>{banner.text}</span>
          <button type="button" onClick={() => setBanner(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Navigation Tabs Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => changeTab('overview')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Ringkasan</span>
        </button>

        <button
          type="button"
          onClick={() => changeTab('listings')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'listings'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Motor Saya ({myMotorcycles.length})</span>
          {pendingModerationCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => changeTab('seller_inquiries')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'seller_inquiries'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Survei Masuk ({sellerInquiries.length})</span>
          {pendingSellerInquiriesCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
              {pendingSellerInquiriesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => changeTab('buyer_inquiries')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'buyer_inquiries'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5" />
          <span>Survei Keluar ({buyerInquiries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => changeTab('favorites')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'favorites'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Favorit ({favorites.length})</span>
        </button>

        <div className="ml-auto">
          <Link
            href="/garasi-saya/tambah"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Jual Motor Baru</span>
          </Link>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 0: OVERVIEW & STATISTIK GARASI                              */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Total Listing
                </span>
                <Bike className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {myMotorcycles.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {activeListingsCount} unit aktif tayang di katalog
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Menunggu Review
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600">
                {pendingModerationCount}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Verifikasi dokumen & AI oleh tim admin
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Survei Masuk
                </span>
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {sellerInquiries.length}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {pendingSellerInquiriesCount} jadwal perlu respon
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Favorit Disimpan
                </span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {favorites.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Motor incaran yang sedang Anda pantau
              </p>
            </div>
          </div>

          {/* Banner Aksi Cepat AI */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 shadow-md">
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-extrabold uppercase tracking-wider border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Teknologi Inspeksi AI YOLOv8</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Jual Motor Lebih Cepat dengan Sertifikat Transparan
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
                Gunakan simulator inspeksi AI kami untuk memindai baret dan penyok secara otomatis, dapatkan valuasi pasar objektif, dan terbitkan listing bergaransi terverifikasi di Bali.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/inspect-simulator"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-950 font-extrabold text-xs hover:bg-indigo-50 transition shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Jalankan Simulator AI</span>
                </Link>
                <Link
                  href="/garasi-saya/tambah"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs border border-indigo-400/30 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Terbitkan Listing Motor</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Dua Kolom Ringkasan Aktivitas Terkini */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kolom 1: Survei Masuk Terkini */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Jadwal Survei Masuk Terkini
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Calon pembeli yang ingin cek unit langsung di lokasi
                  </p>
                </div>
                <button
                  onClick={() => changeTab('seller_inquiries')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {sellerInquiries.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Belum ada pengajuan jadwal survei masuk.
                </p>
              ) : (
                <div className="space-y-3">
                  {sellerInquiries.slice(0, 3).map((inq) => (
                    <div
                      key={inq.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {inq.motorcycle?.title || `Motor #${inq.motorcycle_id}`}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Dari: <span className="font-semibold text-slate-700">{inq.buyer?.name || 'Calon Pembeli'}</span> • {formatDateTimeWita(inq.appointment_date)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                          inq.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : inq.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kolom 2: Motor Listing Terkini */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Listing Motor Terkini
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Unit motor bekas yang Anda daftarkan di garasi
                  </p>
                </div>
                <button
                  onClick={() => changeTab('listings')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {myMotorcycles.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-slate-400 mb-2">
                    Anda belum mendaftarkan motor untuk dijual.
                  </p>
                  <Link
                    href="/garasi-saya/tambah"
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    + Terbitkan Listing Sekarang
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myMotorcycles.slice(0, 3).map((unit) => (
                    <div
                      key={unit.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {unit.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatCurrency(unit.seller_price)} • {unit.year} • {unit.location_address || 'Bali'}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                          unit.moderation_status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : unit.moderation_status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {unit.moderation_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: LISTING MOTOR SAYA                                      */}
      {/* ============================================================== */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">
              Daftar Motor Saya ({myMotorcycles.length})
            </h2>
            <Link
              href="/garasi-saya/tambah"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Unit</span>
            </Link>
          </div>

          {myMotorcycles.length === 0 ? (
            <EmptyState
              title="Garasi Masih Kosong"
              description="Anda belum mendaftarkan motor untuk dijual. Lakukan inspeksi AI dan terbitkan motor Anda sekarang."
              actionLabel="Tambah Motor Sekarang"
              onAction={() => router.push('/garasi-saya/tambah')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myMotorcycles.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                >
                  <MotorcycleCard motorcycle={unit} />

                  {/* Seller Action Bar */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(unit)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ubah</span>
                    </button>

                    <Link
                      href={`/motorcycles/${unit.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lihat Publik</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Apakah Anda yakin ingin menghapus / mengarsipkan "${unit.title}"?`
                          )
                        ) {
                          handleDeleteListing(unit.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition ml-auto"
                      title="Hapus Listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SURVEI MASUK (PENJUAL)                                  */}
      {/* ============================================================== */}
      {activeTab === 'seller_inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Pengajuan Jadwal Survei Masuk ({sellerInquiries.length})
              </h2>
              <p className="text-xs text-slate-500">
                Calon pembeli yang mengajukan jadwal bertemu langsung untuk inspeksi fisik.
              </p>
            </div>
          </div>

          {sellerInquiries.length === 0 ? (
            <EmptyState
              title="Belum Ada Pengajuan Survei"
              description="Ketika calon pembeli mengajukan jadwal survei untuk motor Anda, daftarnya akan tampil di sini."
            />
          ) : (
            <div className="space-y-4">
              {sellerInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900">
                        {inq.motorcycle?.title || `Motor #${inq.motorcycle_id}`}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          inq.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : inq.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inq.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        Pembeli:{' '}
                        <strong className="text-slate-900">
                          {inq.buyer?.name || 'User'}
                        </strong>{' '}
                        ({inq.buyer?.phone_whatsapp || 'WhatsApp'})
                      </span>
                      <span>
                        Jadwal:{' '}
                        <strong className="text-indigo-700">
                          {formatDateTimeWita(inq.appointment_date)}
                        </strong>
                      </span>
                    </div>

                    {inq.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                        &quot;{inq.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions based on status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {inq.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleSellerInquiryAction(inq.id, 'accepted')
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Terima Jadwal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSellerInquiryAction(inq.id, 'rejected')
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}

                    {inq.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSellerInquiryAction(inq.id, 'completed')
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Selesaikan Transaksi</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SURVEI KELUAR (PEMBELI)                                 */}
      {/* ============================================================== */}
      {activeTab === 'buyer_inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Pengajuan Survei Saya ({buyerInquiries.length})
              </h2>
              <p className="text-xs text-slate-500">
                Daftar janji survei yang telah Anda ajukan kepada penjual unit motor.
              </p>
            </div>
          </div>

          {buyerInquiries.length === 0 ? (
            <EmptyState
              title="Belum Ada Pengajuan Survei Keluar"
              description="Temukan motor impian Anda di katalog publik, lalu klik 'Jadwalkan Survei Fisik' pada detail motor."
              actionLabel="Jelajahi Katalog Motor"
              onAction={() => router.push('/')}
            />
          ) : (
            <div className="space-y-4">
              {buyerInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/motorcycles/${inq.motorcycle_id}`}
                        className="text-xs font-extrabold text-slate-900 hover:text-indigo-600 transition"
                      >
                        {inq.motorcycle?.title || `Motor #${inq.motorcycle_id}`}
                      </Link>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          inq.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : inq.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inq.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        Penjual:{' '}
                        <strong className="text-slate-900">
                          {inq.seller?.name || 'Penjual'}
                        </strong>{' '}
                        ({inq.seller?.phone_whatsapp || 'WhatsApp'})
                      </span>
                      <span>
                        Jadwal:{' '}
                        <strong className="text-indigo-700">
                          {formatDateTimeWita(inq.appointment_date)}
                        </strong>
                      </span>
                    </div>

                    {inq.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                        Pesan Anda: &quot;{inq.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/motorcycles/${inq.motorcycle_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lihat Unit</span>
                    </Link>

                    {inq.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleBuyerCancelInquiry(inq.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Batalkan</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: MOTOR FAVORIT SAYA                                      */}
      {/* ============================================================== */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">
              Koleksi Motor Favorit ({favorites.length})
            </h2>
          </div>

          {favorites.length === 0 ? (
            <EmptyState
              title="Belum Ada Motor Favorit"
              description="Jelajahi katalog dan tekan ikon hati untuk menyimpan motor incaran Anda di sini."
              actionLabel="Cari Motor Bekas di Bali"
              onAction={() => router.push('/')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {favorites.map((unit) => (
                <MotorcycleCard key={unit.id} motorcycle={unit} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL EDIT LISTING (HARGA & STATUS)                            */}
      {/* ============================================================== */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Ubah Harga & Status Listing
              </h3>
              <button
                type="button"
                onClick={() => setEditingUnit(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-semibold">
              {editingUnit.title} ({editingUnit.year})
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harga Penjual (Rp)
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Ketersediaan
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as ListingStatus)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="available">Tersedia (Available)</option>
                  <option value="sold">Terjual (Sold)</option>
                  <option value="reserved">Dipesan (Reserved)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GaragePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <GarageContent />
    </Suspense>
  );
}
