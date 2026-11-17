'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertOctagon,
  BarChart3,
  Check,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Flag,
  Loader2,
  MessageSquareWarning,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import type {
  ActivityLogItem,
  AdminDashboardData,
  AdminInspectionFeedbackItem,
  AdminInspectionMetrics,
  AdminReportItem,
  ReportStatus,
} from '@/types/admin';
import type { FeedbackReviewStatus } from '@/types/inspection';
import type {
  MotorcycleCategory,
  MotorcycleListItem,
  MotorcycleModelRef,
} from '@/types/motorcycle';
import { adminService } from '@/services/adminService';
import { motorcycleService } from '@/services/motorcycleService';
import { ApiClientError } from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { PriceBadge } from '@/components/shared/PriceBadge';
import { formatCurrency, formatDateTimeWita } from '@/utils/formatters';
import {
  AdminDashboardLayout,
  type AdminActiveTab,
} from '@/components/admin/AdminDashboardLayout';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminActiveTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Data states
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [metrics, setMetrics] = useState<AdminInspectionMetrics | null>(null);
  const [motorcycles, setMotorcycles] = useState<MotorcycleListItem[]>([]);
  const [modFilter, setModFilter] = useState<string>('');
  const [models, setModels] = useState<MotorcycleModelRef[]>([]);
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<AdminInspectionFeedbackItem[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);

  // New Model Form State
  const [newBrand, setNewBrand] = useState('Honda');
  const [newModelName, setNewModelName] = useState('');
  const [newCc, setNewCc] = useState<number>(150);
  const [newCategory, setNewCategory] = useState<MotorcycleCategory>('matic');
  const [newStdPrice, setNewStdPrice] = useState<number>(28000000);
  const [creatingModel, setCreatingModel] = useState<boolean>(false);

  const loadAdminData = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;
    setLoading(true);
    try {
      const [dashRes, metRes, modRes, modelRes, repRes, fbRes, logRes] =
        await Promise.all([
          adminService.getDashboard(),
          adminService.getInspectionMetrics(),
          adminService.getMotorcycles(modFilter || undefined, 1, 30),
          motorcycleService.getModels(),
          adminService.getReports(undefined, 1, 30),
          adminService.getInspectionFeedbacks(undefined, 1, 30),
          adminService.getActivityLogs(1, 30),
        ]);
      setDashboard(dashRes.data);
      setMetrics(metRes.data);
      setMotorcycles(modRes.data || []);
      setModels(modelRes.data || []);
      setReports(repRes.data || []);
      setFeedbacks(fbRes.data || []);
      setLogs(logRes.data || []);
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal memuat data dashboard admin.',
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, modFilter]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && isAdmin) {
      loadAdminData();
    } else if (!authLoading && isAuthenticated && !isAdmin) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isAdmin, router, loadAdminData]);

  const handleModerate = async (
    id: number,
    status: 'approved' | 'rejected'
  ) => {
    setBanner(null);
    try {
      await adminService.moderateMotorcycle(id, {
        moderation_status: status,
        rejection_reason:
          status === 'rejected'
            ? 'Data atau foto belum memenuhi standar verifikasi MotoLens.'
            : undefined,
      });
      setBanner({
        type: 'success',
        text: `Listing #${id} berhasil diubah status moderasinya menjadi "${status}". Notifikasi dikirim ke penjual.`,
      });
      loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal memoderasi listing.',
      });
    }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingModel(true);
    setBanner(null);
    try {
      await adminService.createModel({
        brand: newBrand,
        model_name: newModelName,
        engine_cc: Number(newCc),
        category: newCategory,
        standard_price: Number(newStdPrice),
      });
      setNewModelName('');
      setBanner({
        type: 'success',
        text: 'Model referensi baru berhasil ditambahkan.',
      });
      loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal menambah model referensi.',
      });
    } finally {
      setCreatingModel(false);
    }
  };

  const handleDeleteModel = async (id: number) => {
    setBanner(null);
    try {
      await adminService.deleteModel(id);
      setBanner({
        type: 'success',
        text: 'Model referensi berhasil dinonaktifkan/dihapus.',
      });
      loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal menghapus model referensi.',
      });
    }
  };

  const handleUpdateReportStatus = async (id: number, status: ReportStatus) => {
    setBanner(null);
    try {
      await adminService.updateReport(id, status);
      setBanner({
        type: 'success',
        text: `Status laporan #${id} diperbarui menjadi "${status}".`,
      });
      loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal mengubah status laporan.',
      });
    }
  };

  const handleUpdateFeedbackStatus = async (
    id: number,
    reviewStatus: FeedbackReviewStatus
  ) => {
    setBanner(null);
    try {
      await adminService.updateInspectionFeedback(id, reviewStatus);
      setBanner({
        type: 'success',
        text: `Status review feedback AI #${id} diperbarui menjadi "${reviewStatus}".`,
      });
      loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal mengubah status review feedback.',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
          Menyiapkan Konsol Admin & Metrik MotoLens...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-3xl border border-rose-900/60 p-8 text-center space-y-4 max-w-md shadow-2xl text-slate-100">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-extrabold text-white">
            HTTP 403 — Akses Terbatas Administrator
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Halaman ini dilindungi oleh Spatie Role <code>admin</code>. Silakan
            masuk menggunakan akun Administrator resmi untuk mengakses panel kontrol.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
          >
            Kembali ke Katalog Publik
          </Link>
        </div>
      </div>
    );
  }

  const pendingModerationCount = motorcycles.filter(
    (m) => m.moderation_status === 'pending'
  ).length;
  const pendingReportsCount = reports.filter(
    (r) => r.status === 'open'
  ).length;

  const dist = dashboard?.price_label_distribution;
  const goodDealCount = dist?.good_deal ?? 0;
  const fairPriceCount = dist?.fair_price ?? 0;
  const overpricedCount = dist?.overpriced ?? dist?.above_market ?? 0;
  const totalLabeled = Math.max(
    1,
    goodDealCount + fairPriceCount + overpricedCount
  );

  return (
    <AdminDashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pendingModerationCount={pendingModerationCount}
      pendingReportsCount={pendingReportsCount}
    >
      <div className="space-y-6">
        {/* Banner Notifikasi Aksi Admin */}
        {banner && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
              banner.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/60 border-rose-800 text-rose-200'
            }`}
          >
            <span>{banner.text}</span>
            <button type="button" onClick={() => setBanner(null)}>
              <X className="w-4 h-4 text-slate-400 hover:text-white" />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW & ANALITIK PASAR                               */}
        {/* ============================================================== */}
        {activeTab === 'overview' && dashboard && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Listing
                </span>
                <p className="text-3xl font-black text-white">
                  {dashboard.overview?.total_listings ?? 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Semua motor terdaftar di marketplace
                </p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Perlu Moderasi
                </span>
                <p className="text-3xl font-black text-amber-400">
                  {dashboard.overview?.pending_moderation ?? 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Antrean review motor baru
                </p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Total Inspeksi AI
                </span>
                <p className="text-3xl font-black text-emerald-400">
                  {dashboard.overview?.total_inspections ?? 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hasil pemindaian kerusakan AI
                </p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                  Total Nilai Pasar
                </span>
                <p className="text-lg font-black text-white truncate">
                  {formatCurrency(dashboard.overview?.total_catalog_value ?? 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Akumulasi nilai listing aktif
                </p>
              </div>
            </div>

            {/* Price Distribution & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution Chart Bar */}
              <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-rose-500" />
                  <span>Distribusi Price Label Pasar Bali (PRD Bab 4.8)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Perbandingan harga jual terhadap nilai wajar hasil prediksi ML
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-400">
                        Good Deal ({goodDealCount} unit)
                      </span>
                      <span className="text-slate-400">
                        {Math.round((goodDealCount / totalLabeled) * 100)}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${(goodDealCount / totalLabeled) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-blue-400">
                        Fair Price ({fairPriceCount} unit)
                      </span>
                      <span className="text-slate-400">
                        {Math.round((fairPriceCount / totalLabeled) * 100)}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{
                          width: `${(fairPriceCount / totalLabeled) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-rose-400">
                        Overpriced / Above Market ({overpricedCount} unit)
                      </span>
                      <span className="text-slate-400">
                        {Math.round((overpricedCount / totalLabeled) * 100)}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{
                          width: `${(overpricedCount / totalLabeled) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Moderation & Quality Overview */}
              <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Kualitas & Integritas Marketplace</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">
                      Listing Disetujui
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      {dashboard.overview?.approved_listings ??
                        motorcycles.filter((m) => m.moderation_status === 'approved').length}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">
                      Listing Ditolak
                    </span>
                    <span className="text-2xl font-black text-rose-400">
                      {dashboard.overview?.rejected_listings ??
                        motorcycles.filter((m) => m.moderation_status === 'rejected').length}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('moderation')}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Buka Panel Moderasi Listing ({pendingModerationCount})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MODERASI LISTING MOTOR                                  */}
        {/* ============================================================== */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-sm font-extrabold text-white">
                  Daftar Pengajuan Listing Motor ({motorcycles.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Tinjau data unit, kepatuhan harga, dan hasil deteksi baret/penyok sebelum terbit
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModFilter('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    modFilter === ''
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setModFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    modFilter === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Pending ({pendingModerationCount})
                </button>
                <button
                  type="button"
                  onClick={() => setModFilter('approved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    modFilter === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Disetujui
                </button>
              </div>
            </div>

            {motorcycles.length === 0 ? (
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-8 text-center text-xs text-slate-400">
                Tidak ada listing pada filter ini.
              </div>
            ) : (
              <div className="space-y-3">
                {motorcycles.map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white">
                          #{unit.id} — {unit.title}
                        </span>
                        <PriceBadge label={unit.price_label} />
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            unit.moderation_status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : unit.moderation_status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {unit.moderation_status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          Penjual: <strong className="text-slate-200">{unit.seller?.name || 'User'}</strong>
                        </span>
                        <span>
                          Harga Penjual: <strong className="text-rose-400">{formatCurrency(unit.seller_price)}</strong>
                        </span>
                        <span>
                          Prediksi AI: <strong className="text-indigo-400">{formatCurrency(unit.ml_predicted_price || 0)}</strong>
                        </span>
                        <span>
                          Tahun: <strong className="text-slate-200">{unit.year}</strong>
                        </span>
                        <span>
                          Odometer: <strong className="text-slate-200">{(unit.odometer_km || 0).toLocaleString('id-ID')} km</strong>
                        </span>
                      </div>

                      {(unit as unknown as { rejection_reason?: string }).rejection_reason && (
                        <p className="text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-900/50">
                          Alasan Ditolak: {(unit as unknown as { rejection_reason?: string }).rejection_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/motorcycles/${unit.id}`}
                        target="_blank"
                        className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Pratinjau</span>
                      </Link>

                      {unit.moderation_status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleModerate(unit.id, 'approved')}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                      )}

                      {unit.moderation_status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleModerate(unit.id, 'rejected')}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 transition flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
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
        {/* TAB 3: MASTER REFERENSI HARGA (CRUD)                           */}
        {/* ============================================================== */}
        {activeTab === 'models' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Tambah Model */}
            <div className="lg:col-span-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-500" />
                <span>Tambah Model Referensi Baru</span>
              </h3>

              <form onSubmit={handleCreateModel} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Merek Motor
                  </label>
                  <select
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="Kawasaki">Kawasaki</option>
                    <option value="Vespa">Vespa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Nama Model
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Vario 160 CBS"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Kapasitas (cc)
                    </label>
                    <input
                      type="number"
                      required
                      value={newCc}
                      onChange={(e) => setNewCc(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Kategori
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) =>
                        setNewCategory(e.target.value as MotorcycleCategory)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                    >
                      <option value="matic">Matic</option>
                      <option value="sport">Sport</option>
                      <option value="bebek">Bebek</option>
                      <option value="klasik">Klasik</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Harga Standar Pasar (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000000}
                    value={newStdPrice}
                    onChange={(e) => setNewStdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingModel}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition disabled:opacity-50"
                >
                  {creatingModel ? 'Menyimpan...' : 'Simpan Model Referensi'}
                </button>
              </form>
            </div>

            {/* Tabel Model Referensi */}
            <div className="lg:col-span-8 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Daftar Master Model ({models.length})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3.5 font-bold">Merek & Model</th>
                      <th className="p-3.5 font-bold">Kategori / CC</th>
                      <th className="p-3.5 font-bold">Harga Standar</th>
                      <th className="p-3.5 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {models.map((mod) => (
                      <tr key={mod.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-bold text-white">
                          {mod.brand} {mod.model_name}
                        </td>
                        <td className="p-3.5 text-slate-400 uppercase">
                          {mod.category} • {mod.engine_cc}cc
                        </td>
                        <td className="p-3.5 font-bold text-rose-400">
                          {formatCurrency(mod.standard_price)}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteModel(mod.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 transition"
                            title="Nonaktifkan / Hapus Model"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: METRIK & KESEHATAN MODEL ONNX                           */}
        {/* ============================================================== */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 space-y-2">
                <p className="text-xs font-bold uppercase text-indigo-400">
                  Kecepatan Inferensi ONNX (`inference_time_ms`)
                </p>
                <p className="text-3xl font-extrabold text-white">
                  {metrics.inference_time_ms.average} ms
                </p>
                <p className="text-xs text-slate-400">
                  Min: {metrics.inference_time_ms.min} ms • Max:{' '}
                  {metrics.inference_time_ms.max} ms
                </p>
              </div>

              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 space-y-2">
                <p className="text-xs font-bold uppercase text-emerald-400">
                  Rata-Rata Confidence Deteksi
                </p>
                <p className="text-3xl font-extrabold text-white">
                  {Math.round((metrics.accuracy_metrics.average_confidence || 0) * 100)}%
                </p>
                <p className="text-xs text-slate-400">
                  Completed: {metrics.completed_inspections} • Failed:{' '}
                  {metrics.failed_inspections}
                </p>
              </div>

              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 space-y-2">
                <p className="text-xs font-bold uppercase text-amber-400">
                  Total Bounding Box Terdeteksi
                </p>
                <p className="text-3xl font-extrabold text-white">
                  {metrics.accuracy_metrics.detections_by_class.total} BBox
                </p>
                <p className="text-xs text-slate-400">
                  Scratch: {metrics.accuracy_metrics.detections_by_class.scratch} •
                  Dent: {metrics.accuracy_metrics.detections_by_class.dent} •
                  Accident: {metrics.accuracy_metrics.detections_by_class.accident}
                </p>
              </div>
            </div>

            {/* Spesifikasi Model ONNX Card */}
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 space-y-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Spesifikasi Pipeline Inferensi YOLOv8 ONNX</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Model Architecture</span>
                  <span className="font-bold text-white">YOLOv8 Nano (12.7 MB)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Inference Engine</span>
                  <span className="font-bold text-white">ONNX Runtime (CPU)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Input Resolution</span>
                  <span className="font-bold text-white">640x640 px</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Confidence Threshold</span>
                  <span className="font-bold text-white">0.25 (NMS 0.45)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: LAPORAN LISTING MENCURIGAKAN (REPORTS)                  */}
        {/* ============================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-500" />
                  <span>Laporan Listing Mencurigakan ({reports.length})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Laporan dari calon pembeli terkait indikasi penipuan, data palsu, atau foto manipulasi
                </p>
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-8 text-center text-xs text-slate-400">
                Belum ada laporan listing yang masuk.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-rose-400 uppercase text-xs">
                        {rep.reason}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          rep.status === 'open'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : rep.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-white">
                      Unit: {rep.motorcycle?.title || `#${rep.motorcycle_id}`}
                    </p>
                    <p className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      &quot;{rep.description}&quot;
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {(['reviewing', 'resolved', 'dismissed'] as ReportStatus[]).map(
                        (st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateReportStatus(rep.id, st)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-600 hover:text-white text-[11px] font-bold capitalize transition border border-slate-700"
                          >
                            Set {st}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: REVIEW FEEDBACK DETEKSI AI                              */}
        {/* ============================================================== */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-4">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4 text-indigo-400" />
                  <span>Review Feedback Deteksi Kerusakan AI ({feedbacks.length})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Umpan balik dari pengguna (false positive / missed detection) untuk continuous improvement dataset YOLOv8
                </p>
              </div>
            </div>

            {feedbacks.length === 0 ? (
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-8 text-center text-xs text-slate-400">
                Belum ada feedback hasil deteksi AI dari pengguna.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-indigo-400 uppercase text-xs">
                        {fb.feedback_type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          fb.review_status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : fb.review_status === 'accepted'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {fb.review_status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      {fb.comment}
                    </p>

                    <p className="text-[11px] text-slate-500">
                      Oleh: <strong className="text-slate-400">{fb.submitter?.name}</strong> • ID Inspeksi #{fb.inspection_id}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateFeedbackStatus(fb.id, 'accepted')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition"
                      >
                        Accept (Valid Ground Truth)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateFeedbackStatus(fb.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-bold transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: AUDIT LOG AKTIVITAS                                     */}
        {/* ============================================================== */}
        {activeTab === 'logs' && (
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Spatie Activity Log ({logs.length})
                </h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="p-3.5 font-bold">Waktu (WITA)</th>
                    <th className="p-3.5 font-bold">Kategori Log</th>
                    <th className="p-3.5 font-bold">Deskripsi Aktivitas</th>
                    <th className="p-3.5 font-bold">Aktor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDateTimeWita(log.created_at)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-400 font-bold">
                          {log.log_name}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-white">
                        {log.description}
                      </td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {log.causer?.name || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
