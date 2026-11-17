'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bike,
  Calendar,
  Check,
  Edit3,
  Heart,
  Loader2,
  Plus,
  Trash2,
  Warehouse,
  X,
  ExternalLink,
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

type GarageTab = 'listings' | 'seller_inquiries' | 'buyer_inquiries' | 'favorites';

function GarageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const initialTab =
    (searchParams.get('tab') as GarageTab) || 'listings';
  const [activeTab, setActiveTab] = useState<GarageTab>(initialTab);

  const [myMotorcycles, setMyMotorcycles] = useState<MotorcycleListItem[]>([]);
  const [sellerInquiries, setSellerInquiries] = useState<InquiryItem[]>([]);
  const [buyerInquiries, setBuyerInquiries] = useState<InquiryItem[]>([]);
  const [favorites, setFavorites] = useState<MotorcycleListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mb-2" />
        <p className="text-xs font-semibold text-slate-600">
          Memuat Garasi, Jadwal Survei & Daftar Favorit...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Warehouse className="w-7 h-7 text-indigo-600" />
            <span>Garasi Saya & Manajemen Survei</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Kelola iklan motor Anda, konfirmasi jadwal survei pembeli, dan
            pantau motor favorit.
          </p>
        </div>

        <Link
          href="/garasi-saya/tambah"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Terbitkan Listing Baru</span>
        </Link>
      </div>

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

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'listings'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Motor Saya ({myMotorcycles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seller_inquiries')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'seller_inquiries'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Survei Masuk — Penjual ({sellerInquiries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('buyer_inquiries')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'buyer_inquiries'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Survei Keluar — Pembeli ({buyerInquiries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'favorites'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Motor Favorit ({favorites.length})</span>
        </button>
      </div>

      {/* Tab 1: My Motorcycles */}
      {activeTab === 'listings' && (
        <div>
          {myMotorcycles.length === 0 ? (
            <EmptyState
              title="Belum Ada Motor di Garasi Anda"
              description="Jalankan inspeksi AI terlebih dahulu dan terbitkan listing motor bekas Anda."
              actionLabel="Inspeksi & Terbitkan Motor"
              onAction={() => router.push('/garasi-saya/tambah')}
            />
          ) : (
            <div className="space-y-4">
              {myMotorcycles.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        unit.main_image_url ||
                        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={unit.title}
                      className="w-24 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            unit.moderation_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : unit.moderation_status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Moderasi: {unit.moderation_status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-700">
                          Status Unit: {unit.status}
                        </span>
                        <PriceBadge label={unit.price_label} size="sm" />
                      </div>

                      <Link
                        href={`/motorcycles/${unit.id}`}
                        className="text-base font-extrabold text-slate-900 hover:text-indigo-600 flex items-center gap-1"
                      >
                        <span>{unit.title}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <p className="text-xs text-slate-600">
                        Harga Jual:{' '}
                        <strong className="text-slate-900">
                          {formatCurrency(unit.seller_price)}
                        </strong>{' '}
                        • Estimasi AI:{' '}
                        <strong className="text-indigo-600">
                          {formatCurrency(unit.ml_predicted_price)}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(unit)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Ubah Harga / Status</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteListing(unit.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Arsipkan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Seller Inquiries */}
      {activeTab === 'seller_inquiries' && (
        <div>
          {sellerInquiries.length === 0 ? (
            <EmptyState
              title="Belum Ada Pengajuan Survei Masuk"
              description="Pengajuan jadwal survei fisik dari calon pembeli terhadap motor Anda akan muncul di sini."
            />
          ) : (
            <div className="space-y-3">
              {sellerInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-50 text-indigo-700">
                      Status: {inq.status}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 pt-1">
                      {inq.motorcycle?.title || `Motor #${inq.motorcycle_id}`}
                    </h3>
                    <p className="text-slate-600">
                      Calon Pembeli: <strong>{inq.buyer?.name}</strong> (
                      {inq.buyer?.phone_whatsapp || '-'})
                    </p>
                    <p className="text-slate-600">
                      Jadwal Survei:{' '}
                      <strong>{formatDateTimeWita(inq.appointment_date)}</strong>
                      {inq.offered_price
                        ? ` • Tawaran: ${formatCurrency(inq.offered_price)}`
                        : ''}
                    </p>
                    {inq.notes && (
                      <p className="text-slate-500 italic">
                        &ldquo;{inq.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {inq.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleSellerInquiryAction(inq.id, 'accepted')
                          }
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Terima Survei</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSellerInquiryAction(inq.id, 'rejected')
                          }
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
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
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Tandai Survei & Transaksi Selesai</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Buyer Inquiries */}
      {activeTab === 'buyer_inquiries' && (
        <div>
          {buyerInquiries.length === 0 ? (
            <EmptyState
              title="Belum Ada Pengajuan Survei Keluar"
              description="Pilih unit motor dari katalog dan klik Ajukan Jadwal Survei Fisik untuk menjadwalkan pengecekan unit."
              actionLabel="Jelajahi Katalog Motor"
              onAction={() => router.push('/')}
            />
          ) : (
            <div className="space-y-3">
              {buyerInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-50 text-indigo-700">
                      Status: {inq.status}
                    </span>
                    <Link
                      href={`/motorcycles/${inq.motorcycle_id}`}
                      className="block text-sm font-extrabold text-slate-900 hover:text-indigo-600 pt-1"
                    >
                      {inq.motorcycle?.title || `Motor #${inq.motorcycle_id}`}
                    </Link>
                    <p className="text-slate-600">
                      Penjual: <strong>{inq.seller?.name}</strong> • Lokasi:{' '}
                      {inq.motorcycle?.location_address}
                    </p>
                    <p className="text-slate-600">
                      Jadwal Survei:{' '}
                      <strong>{formatDateTimeWita(inq.appointment_date)}</strong>
                    </p>
                  </div>

                  {(inq.status === 'pending' || inq.status === 'accepted') && (
                    <button
                      type="button"
                      onClick={() => handleBuyerCancelInquiry(inq.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200"
                    >
                      Batalkan Booking Survei
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Favorites */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <EmptyState
              title="Daftar Motor Favorit Masih Kosong"
              description="Klik ikon hati pada kartu motor di katalog untuk menyimpan unit favorit Anda."
              actionLabel="Cari Motor di Katalog"
              onAction={() => router.push('/')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((item) => (
                <MotorcycleCard
                  key={item.id}
                  motorcycle={{ ...item, is_favorited: true }}
                  onFavoriteToggled={() => loadAllData()}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Listing Modal */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                Ubah Harga / Status Unit
              </h3>
              <button
                type="button"
                onClick={() => setEditingUnit(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Harga Jual Penjual (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={500000}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Status Ketersediaan Unit
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as ListingStatus)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="available">Available (Tersedia)</option>
                  <option value="booked">Booked (Dibooking Survei)</option>
                  <option value="sold">Sold (Sudah Terjual)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
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
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <GarageContent />
    </Suspense>
  );
}
