'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Check,
  Cpu,
  Database,
  Flag,
  Loader2,
  MessageSquareWarning,
  Plus,
  Shield,
  ShieldAlert,
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

type AdminTab =
  | 'overview'
  | 'moderation'
  | 'models'
  | 'metrics'
  | 'reports_feedback'
  | 'logs';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mb-2" />
        <p className="text-xs font-semibold text-slate-600">
          Memuat Dashboard Admin & Analitik Pasar MotoLens...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h1 className="text-xl font-extrabold text-slate-900">
            HTTP 403 — Akses Terbatas Administrator
          </h1>
          <p className="text-xs text-slate-600">
            Halaman ini dilindungi oleh Spatie Role <code>admin</code>. Silakan
            masuk menggunakan akun Administrator untuk mengakses panel moderasi.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Kembali ke Katalog Utama
          </Link>
        </div>
      </div>
    );
  }

  const dist = dashboard?.price_label_distribution;
  const goodDealCount = dist?.good_deal ?? 0;
  const fairPriceCount = dist?.fair_price ?? 0;
  const overpricedCount = dist?.overpriced ?? dist?.above_market ?? 0;
  const totalLabeled = Math.max(
    1,
    goodDealCount + fairPriceCount + overpricedCount
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Spatie Role: Admin Terverifikasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            MotoLens Admin Command Center
          </h1>
          <p className="text-xs text-slate-400">
            Moderasi listing, master harga referensi, pemantauan metrik ONNX,
            review feedback AI, dan audit log.
          </p>
        </div>
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
        {[
          { id: 'overview', label: 'Analitik Pasar', icon: BarChart3 },
          {
            id: 'moderation',
            label: `Moderasi Listing (${dashboard?.overview.pending_moderation ?? 0} Pending)`,
            icon: Shield,
          },
          {
            id: 'models',
            label: `Master Model (${models.length})`,
            icon: Database,
          },
          { id: 'metrics', label: 'Metrik ONNX AI', icon: Cpu },
          {
            id: 'reports_feedback',
            label: `Laporan & Feedback AI (${reports.length + feedbacks.length})`,
            icon: Flag,
          },
          { id: 'logs', label: 'Audit Activity Logs', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Market Analytics */}
      {activeTab === 'overview' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500">Total Listing Katalog</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {dashboard.overview.total_listings}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {dashboard.overview.approved_listings} Approved •{' '}
                {dashboard.overview.pending_moderation} Pending
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500">Nilai Katalog Approved</p>
              <p className="text-xl font-extrabold text-indigo-600 mt-1">
                {formatCurrency(dashboard.overview.total_catalog_value)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Akumulasi harga pasar Bali
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500">Total Inspeksi YOLOv8</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {dashboard.overview.total_inspections}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Scratch: {dashboard.damage_detection_stats.total_scratches} •
                Dent: {dashboard.damage_detection_stats.total_dents}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500">Jadwal Survei & Pengguna</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {dashboard.overview.total_inquiries} Survei
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {dashboard.overview.total_users} Pengguna Terdaftar
              </p>
            </div>
          </div>

          {/* Price Label Distribution Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Distribusi Label Harga Pasar (`price_label`)
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-emerald-700">
                    Good Deal (Di Bawah Estimasi AI)
                  </span>
                  <span>{goodDealCount} unit</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.round(
                        (goodDealCount / totalLabeled) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-sky-700">
                    Fair Price (Sesuai Estimasi AI)
                  </span>
                  <span>{fairPriceCount} unit</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{
                      width: `${Math.round(
                        (fairPriceCount / totalLabeled) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-rose-700">
                    Overpriced (Di Atas Estimasi AI)
                  </span>
                  <span>{overpricedCount} unit</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${Math.round(
                        (overpricedCount / totalLabeled) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Listing Moderation */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Antrean Moderasi Listing Motor
            </h2>
            <select
              value={modFilter}
              onChange={(e) => setModFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
            >
              <option value="">Semua Status Moderasi</option>
              <option value="pending">Pending Moderation</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-3">
            {motorcycles.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        m.moderation_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.moderation_status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.moderation_status}
                    </span>
                    <PriceBadge label={m.price_label} size="sm" />
                  </div>
                  <Link
                    href={`/motorcycles/${m.id}`}
                    className="block text-sm font-extrabold text-slate-900 hover:text-indigo-600 pt-1"
                  >
                    #{m.id} — {m.title}
                  </Link>
                  <p className="text-slate-600">
                    Penjual: <strong>{m.seller?.name}</strong> • Harga:{' '}
                    <strong>{formatCurrency(m.seller_price)}</strong> (AI:{' '}
                    {formatCurrency(m.ml_predicted_price)})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleModerate(m.id, 'approved')}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerate(m.id, 'rejected')}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Master Reference Models CRUD */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <form
              onSubmit={handleCreateModel}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 text-xs"
            >
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Tambah Model Referensi Baru</span>
              </h3>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Merek
                </label>
                <input
                  type="text"
                  required
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Model
                </label>
                <input
                  type="text"
                  required
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Contoh: Stylo 160 ABS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kapasitas (cc)
                  </label>
                  <input
                    type="number"
                    required
                    value={newCc}
                    onChange={(e) => setNewCc(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as MotorcycleCategory)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="matic">Matic</option>
                    <option value="sport">Sport</option>
                    <option value="bebek">Bebek</option>
                    <option value="klasik">Klasik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Harga Standar Pasar (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={1000000}
                  value={newStdPrice}
                  onChange={(e) => setNewStdPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={creatingModel}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {creatingModel ? 'Menyimpan...' : 'Simpan Model Referensi'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-3.5 font-bold">Merek & Model</th>
                    <th className="p-3.5 font-bold">Kategori / CC</th>
                    <th className="p-3.5 font-bold">Harga Standar</th>
                    <th className="p-3.5 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {models.map((mod) => (
                    <tr key={mod.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-bold text-slate-900">
                        {mod.brand} {mod.model_name}
                      </td>
                      <td className="p-3.5 text-slate-600 uppercase">
                        {mod.category} • {mod.engine_cc}cc
                      </td>
                      <td className="p-3.5 font-bold text-indigo-700">
                        {formatCurrency(mod.standard_price)}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteModel(mod.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
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

      {/* Tab 4: ONNX Inference Metrics */}
      {activeTab === 'metrics' && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <p className="text-xs font-bold uppercase text-indigo-600">
              Kecepatan Inferensi ONNX (`inference_time_ms`)
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              {metrics.inference_time_ms.average} ms
            </p>
            <p className="text-xs text-slate-500">
              Min: {metrics.inference_time_ms.min} ms • Max:{' '}
              {metrics.inference_time_ms.max} ms
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <p className="text-xs font-bold uppercase text-emerald-600">
              Rata-Rata Confidence Deteksi
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              {Math.round((metrics.accuracy_metrics.average_confidence || 0) * 100)}%
            </p>
            <p className="text-xs text-slate-500">
              Completed: {metrics.completed_inspections} • Failed:{' '}
              {metrics.failed_inspections}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <p className="text-xs font-bold uppercase text-amber-600">
              Distribusi Deteksi Kelas YOLOv8
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              {metrics.accuracy_metrics.detections_by_class.total} BBox
            </p>
            <p className="text-xs text-slate-600">
              Scratch: {metrics.accuracy_metrics.detections_by_class.scratch} •
              Dent: {metrics.accuracy_metrics.detections_by_class.dent} •
              Accident: {metrics.accuracy_metrics.detections_by_class.accident}
            </p>
          </div>
        </div>
      )}

      {/* Tab 5: Reports & Inspection Feedbacks */}
      {activeTab === 'reports_feedback' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports Column */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Flag className="w-4 h-4 text-rose-600" />
              <span>Laporan Listing Mencurigakan ({reports.length})</span>
            </h3>
            <div className="space-y-3 text-xs">
              {reports.length === 0 ? (
                <p className="text-slate-500 py-4">Belum ada laporan masuk.</p>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700 uppercase">
                        {rep.reason}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold uppercase text-[10px]">
                        {rep.status}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">
                      Unit: {rep.motorcycle?.title || `#${rep.motorcycle_id}`}
                    </p>
                    <p className="text-slate-600">{rep.description}</p>
                    <div className="flex items-center gap-2 pt-1">
                      {(['reviewing', 'resolved', 'dismissed'] as ReportStatus[]).map(
                        (st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateReportStatus(rep.id, st)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-[11px] font-bold capitalize transition"
                          >
                            Set {st}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feedbacks Column */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-indigo-600" />
              <span>Review Feedback Deteksi AI ({feedbacks.length})</span>
            </h3>
            <div className="space-y-3 text-xs">
              {feedbacks.length === 0 ? (
                <p className="text-slate-500 py-4">
                  Belum ada feedback deteksi AI dari pengguna.
                </p>
              ) : (
                feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3.5 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-700 uppercase">
                        {fb.feedback_type}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold uppercase text-[10px]">
                        {fb.review_status}
                      </span>
                    </div>
                    <p className="text-slate-700">{fb.comment}</p>
                    <p className="text-[11px] text-slate-500">
                      Oleh: {fb.submitter?.name} • Inspeksi #{fb.inspection_id}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateFeedbackStatus(fb.id, 'accepted')
                        }
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                      >
                        Accept (Valid)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateFeedbackStatus(fb.id, 'rejected')
                        }
                        className="px-3 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Activity Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold">ID & Waktu (WITA)</th>
                  <th className="p-3.5 font-bold">Kategori Log</th>
                  <th className="p-3.5 font-bold">Deskripsi Aktivitas</th>
                  <th className="p-3.5 font-bold">Aktor (Causer)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      #{log.id} • {formatDateTimeWita(log.created_at)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                        {log.log_name}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      {log.description}
                    </td>
                    <td className="p-3.5 text-slate-600">
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
  );
}
