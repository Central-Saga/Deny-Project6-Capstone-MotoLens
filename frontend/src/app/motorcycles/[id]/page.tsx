'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Cpu,
  FileWarning,
  Flag,
  Gauge,
  Heart,
  History,
  Info,
  Loader2,
  MapPin,
  MessageSquarePlus,
  Phone,
  Scale,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import type { FeedbackType } from '@/types/inspection';
import type { MotorcycleDetail } from '@/types/motorcycle';
import { motorcycleService } from '@/services/motorcycleService';
import { inquiryService } from '@/services/inquiryService';
import { inspectionService } from '@/services/inspectionService';
import { ApiClientError } from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useCompare } from '@/hooks/useCompare';
import { BoundingBoxViewer } from '@/components/features/BoundingBoxViewer';
import { PriceBadge } from '@/components/shared/PriceBadge';
import { ConditionBadge } from '@/components/shared/ConditionBadge';
import { VerificationBadge } from '@/components/shared/VerificationBadge';
import { DamageSummaryPills } from '@/components/shared/DamageSummaryPills';
import { ErrorState } from '@/components/shared/StateFeedback';
import {
  formatCurrency,
  formatDateTimeWita,
  formatNumber,
  formatWhatsAppUrl,
} from '@/utils/formatters';

export default function MotorcycleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isInCompare, toggleCompare } = useCompare();

  const motorcycleId = params?.id;

  const [motorcycle, setMotorcycle] = useState<MotorcycleDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState<boolean>(false);

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Booking form state
  const [appointmentDate, setAppointmentDate] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Feedback form state
  const [feedbackType, setFeedbackType] =
    useState<FeedbackType>('false_positive');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Report form state
  const [reportReason, setReportReason] = useState('fake_odometer');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Toast alert banner
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!motorcycleId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await motorcycleService.getById(motorcycleId);
      setMotorcycle(res.data);
      setFavorited(Boolean(res.data.is_favorited));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Detail unit motor tidak ditemukan.'
      );
    } finally {
      setLoading(false);
    }
  }, [motorcycleId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!motorcycle) return;
    try {
      const res = await motorcycleService.toggleFavorite(motorcycle.id);
      setFavorited(res.data.is_favorited);
      setBanner({
        type: 'success',
        text: res.data.is_favorited
          ? 'Unit ditambahkan ke daftar Favorit Anda.'
          : 'Unit dihapus dari daftar Favorit.',
      });
    } catch {
      setBanner({ type: 'error', text: 'Gagal mengubah status favorit.' });
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motorcycle) return;
    setBookingSubmitting(true);
    setBanner(null);
    try {
      const formattedDate = appointmentDate.replace('T', ' ') + ':00';
      await inquiryService.create({
        motorcycle_id: motorcycle.id,
        appointment_date: formattedDate,
        offered_price: offeredPrice ? Number(offeredPrice) : undefined,
        notes: bookingNotes.trim() || undefined,
      });
      setBookingModalOpen(false);
      setAppointmentDate('');
      setOfferedPrice('');
      setBookingNotes('');
      setBanner({
        type: 'success',
        text: 'Jadwal survei fisik berhasil diajukan! Notifikasi telah dikirim ke penjual.',
      });
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal mengajukan jadwal survei.',
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const certId = motorcycle?.inspection_certificate?.id;
    if (!certId) return;
    setFeedbackSubmitting(true);
    setBanner(null);
    try {
      await inspectionService.submitFeedback(certId, {
        feedback_type: feedbackType,
        comment: feedbackComment,
      });
      setFeedbackModalOpen(false);
      setFeedbackComment('');
      setBanner({
        type: 'success',
        text: 'Feedback koreksi deteksi AI berhasil dikirim untuk ditinjau Admin.',
      });
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal mengirim feedback deteksi AI.',
      });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motorcycle) return;
    setReportSubmitting(true);
    setBanner(null);
    try {
      await motorcycleService.reportListing(motorcycle.id, {
        reason: reportReason,
        description: reportDesc.trim() || undefined,
      });
      setReportModalOpen(false);
      setReportDesc('');
      setBanner({
        type: 'success',
        text: 'Laporan listing berhasil dikirim kepada tim moderasi Admin MotoLens.',
      });
    } catch (err) {
      setBanner({
        type: 'error',
        text:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal mengirim laporan listing.',
      });
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Memuat Sertifikat Inspeksi AI & Explainable Price Breakdown...
        </p>
      </div>
    );
  }

  if (error || !motorcycle) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState
          message={error || 'Data motor tidak ditemukan.'}
          onRetry={fetchDetail}
        />
      </div>
    );
  }

  const cert = motorcycle.inspection_certificate;
  const pb = motorcycle.price_breakdown;
  const inCompare = isInCompare(motorcycle.id);
  const isOwner = user?.id === motorcycle.seller?.id;
  const waUrl = formatWhatsAppUrl(
    motorcycle.seller?.phone_whatsapp,
    `Halo ${motorcycle.seller?.name}, saya tertarik dengan iklan motor "${motorcycle.title}" di MotoLens.`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Motor</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              toggleCompare({
                id: motorcycle.id,
                title: motorcycle.title,
                brand: motorcycle.brand,
                model_name: motorcycle.model_name,
                seller_price: motorcycle.seller_price,
                main_image_url: motorcycle.main_image_url,
              })
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              inCompare
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{inCompare ? 'Dalam Komparasi' : 'Bandingkan Unit'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              favorited
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
            <span>{favorited ? 'Tersimpan di Favorit' : 'Simpan Favorit'}</span>
          </button>

          {!isOwner && (
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  router.push('/login');
                  return;
                }
                setReportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Laporkan Iklan</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {banner && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="p-1 rounded-lg hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: AI Bounding Box Viewer & Certificate Details */}
        <div className="lg:col-span-7 space-y-6">
          <BoundingBoxViewer
            rawImageUrl={cert?.raw_photo_url || cert?.raw_image_url || null}
            annotatedImageUrl={
              cert?.annotated_photo_url || cert?.annotated_image_url || null
            }
            fallbackImageUrl={motorcycle.main_image_url}
            imageWidth={cert?.image_width}
            imageHeight={cert?.image_height}
            detections={cert?.detections_json || cert?.detections || []}
            title={`Inspeksi Visual YOLOv8 — ${motorcycle.title}`}
          />

          {/* AI Certificate Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Sertifikat Inspeksi Visual AI
                  </p>
                  <h2 className="text-lg font-extrabold text-slate-900 font-mono">
                    {cert?.certificate_number || `ML-CERT-${motorcycle.id}`}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <VerificationBadge
                  sourceType={cert?.source_type || motorcycle.source_type}
                  isCameraVerified={motorcycle.is_camera_verified}
                />
                {cert && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push('/login');
                        return;
                      }
                      setFeedbackModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Koreksi Deteksi AI</span>
                  </button>
                )}
              </div>
            </div>

            {/* Detection Summary & Model Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  Ringkasan Deteksi Anomali Bodi
                </p>
                <DamageSummaryPills
                  scratch={
                    cert?.counts?.scratch ?? pb.detection_counts?.scratch ?? 0
                  }
                  dent={cert?.counts?.dent ?? pb.detection_counts?.dent ?? 0}
                  accident={
                    cert?.counts?.accident ?? pb.detection_counts?.accident ?? 0
                  }
                />
                <p className="text-[11px] text-slate-500 pt-1">
                  Penalti kerusakan visual total:{' '}
                  <strong className="text-rose-600">
                    -{pb.damage_penalty_percent}%
                  </strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>Identitas Model ONNX</span>
                </p>
                <p className="text-slate-600">
                  Model:{' '}
                  <strong className="font-mono">
                    {cert?.model_name || 'model_damage'} (
                    {cert?.model_version || pb.model_version})
                  </strong>
                </p>
                <p className="text-slate-600">
                  Confidence Threshold:{' '}
                  <strong>
                    {Math.round(
                      (cert?.confidence_threshold ??
                        pb.confidence_threshold ??
                        0.35) * 100
                    )}
                    %
                  </strong>{' '}
                  • Waktu Inferensi:{' '}
                  <strong>{cert?.inference_time_ms ?? 45} ms</strong>
                </p>
                {cert?.model_sha256 && (
                  <p
                    className="text-[10px] text-slate-400 font-mono truncate"
                    title={cert.model_sha256}
                  >
                    SHA256: {cert.model_sha256.slice(0, 24)}...
                  </p>
                )}
              </div>
            </div>

            {/* Mandatory Disclaimer (PRD Bab 1.4 & 3.7) */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-950">
                <p className="font-bold">
                  Pernyataan Batasan Model AI (Disclaimer Wajib)
                </p>
                <p className="leading-relaxed text-amber-900">
                  Model YOLOv8n MotoLens hanya menganalisis anomali visual pada
                  bodi luar (<em>Scratch</em>, <em>Dent</em>, <em>Accident</em>)
                  berdasarkan foto yang diunggah. Hasil ini{' '}
                  <strong>bukan jaminan kondisi mesin internal</strong>, rangka
                  tersembunyi, kelistrikan, riwayat banjir, maupun keabsahan
                  dokumen STNK/BPKB. Pembeli wajib melakukan inspeksi fisik saat
                  jadwal survei.
                </p>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              Deskripsi & Catatan Penjual
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {motorcycle.description ||
                'Penjual tidak menyertakan catatan deskripsi tambahan.'}
            </p>
          </div>
        </div>

        {/* Right Column: Summary, Explainable Price Breakdown & Booking CTA */}
        <div className="lg:col-span-5 space-y-6">
          {/* Primary Listing Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PriceBadge label={motorcycle.price_label} size="md" />
              <ConditionBadge
                grade={motorcycle.condition_grade}
                showDescription={false}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {motorcycle.brand} • {motorcycle.model_name} (
                {motorcycle.engine_cc}cc)
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                {motorcycle.title}
              </h1>
            </div>

            {/* Key Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-slate-500">Tahun Perakitan</p>
                  <p className="font-bold text-slate-900">{motorcycle.year}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
                <Gauge className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-slate-500">Odometer</p>
                  <p className="font-bold text-slate-900">
                    {formatNumber(motorcycle.odometer_km)} km
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-slate-500">Status Pajak STNK</p>
                  <p className="font-bold text-slate-900 uppercase">
                    {motorcycle.tax_status === 'active'
                      ? 'Aktif (Hidup)'
                      : 'Pajak Mati'}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="truncate">
                  <p className="text-slate-500">Lokasi Unit</p>
                  <p className="font-bold text-slate-900 truncate">
                    {motorcycle.location_address}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Highlight Box */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">
                  Harga Permintaan Penjual
                </span>
                <span className="text-2xl font-extrabold text-white">
                  {formatCurrency(motorcycle.seller_price)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                <span className="text-xs text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Taksiran Wajar Sistem AI</span>
                </span>
                <span className="text-base font-bold text-indigo-300">
                  {formatCurrency(motorcycle.ml_predicted_price)}
                </span>
              </div>
            </div>

            {/* Action CTAs: Booking Survei & WhatsApp */}
            <div className="space-y-2.5 pt-1">
              {!isOwner && motorcycle.status === 'available' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      router.push('/login');
                      return;
                    }
                    setBookingModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Ajukan Jadwal Survei Fisik</span>
                </button>
              )}

              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Hubungi Penjual ({motorcycle.seller?.name}) via WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Explainable Price Breakdown Card (PRD Bab 4.8) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Explainable Price Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Transparansi rumus depresiasi & penalti kerusakan AI (Bab 4.8)
                </p>
              </div>
              <Info className="w-5 h-5 text-indigo-600 shrink-0" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">
                  Harga Referensi Standar Model
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(pb.standard_price)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">
                  Depresiasi Usia ({pb.vehicle_age_years} thn / -
                  {pb.age_depreciation_percent}%)
                </span>
                <span className="font-semibold text-rose-600">
                  - {formatCurrency(pb.age_depreciation_amount)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">
                  Penalti Odometer ({formatNumber(pb.odometer_km)} km)
                </span>
                <span className="font-semibold text-rose-600">
                  - {formatCurrency(pb.odometer_penalty)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">
                  Penalti Status Pajak ({pb.tax_status})
                </span>
                <span className="font-semibold text-rose-600">
                  - {formatCurrency(pb.tax_penalty)}
                </span>
              </div>

              <div className="flex justify-between py-2 bg-slate-50 px-3 rounded-lg font-bold">
                <span className="text-slate-800">
                  Harga Dasar Setelah Depresiasi
                </span>
                <span className="text-slate-900">
                  {formatCurrency(pb.base_depreciated_price)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">
                  Penalti Kerusakan Visual AI (-{pb.damage_penalty_percent}%)
                </span>
                <span className="font-semibold text-rose-600">
                  -{' '}
                  {formatCurrency(
                    Math.max(
                      0,
                      pb.base_depreciated_price - pb.ml_predicted_price
                    )
                  )}
                </span>
              </div>

              <div className="flex justify-between py-2.5 bg-indigo-50 px-3 rounded-xl font-extrabold text-indigo-950 border border-indigo-200">
                <span>Estimasi Harga Wajar AI</span>
                <span>{formatCurrency(pb.ml_predicted_price)}</span>
              </div>
            </div>
          </div>

          {/* Price Change History Card (motorcycle_price_histories) */}
          {motorcycle.price_histories &&
            motorcycle.price_histories.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span>Riwayat Perubahan Harga</span>
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {motorcycle.price_histories.map((h) => (
                    <div
                      key={h.id}
                      className="py-2 flex items-center justify-between"
                    >
                      <div>
                        <span className="line-through text-slate-400 mr-2">
                          {formatCurrency(h.old_price)}
                        </span>
                        <span className="font-bold text-slate-900">
                          → {formatCurrency(h.new_price)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTimeWita(h.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Modal 1: Booking Survei Fisik */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                Ajukan Jadwal Survei Fisik
              </h3>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal & Waktu Survei (WITA)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tawaran Harga Opsional (Rp)
                </label>
                <input
                  type="number"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  placeholder={`Harga penjual: ${motorcycle.seller_price}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Lokasi Pertemuan / Pesan untuk Penjual
                </label>
                <textarea
                  rows={3}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Contoh: Saya ingin cek fisik mesin dan kelengkapan STNK/BPKB sore hari."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50"
                >
                  {bookingSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Survei'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Feedback Deteksi AI */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                Kirim Feedback Hasil Deteksi AI
              </h3>
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kategori Evaluasi Deteksi
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) =>
                    setFeedbackType(e.target.value as FeedbackType)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="false_positive">
                    False Positive (Pantulan cahaya terdeteksi sebagai lecet)
                  </option>
                  <option value="false_negative">
                    False Negative (Ada penyok/lecet yang tidak terdeteksi)
                  </option>
                  <option value="wrong_class">
                    Salah Kelas (Contoh: Scratch terdeteksi sebagai Dent)
                  </option>
                  <option value="accurate">
                    Deteksi Sangat Akurat
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Penjelasan Detail
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Jelaskan koreksi deteksi untuk membantu evaluasi dataset..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50"
                >
                  {feedbackSubmitting ? 'Mengirim...' : 'Kirim Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Lapor Listing */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-rose-600" />
                <span>Laporkan Iklan Mencurigakan</span>
              </h3>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan Pelaporan
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="fake_odometer">
                    Indikasi Manipulasi Odometer
                  </option>
                  <option value="wrong_price">
                    Harga Tidak Sesuai / Palsu
                  </option>
                  <option value="suspicious_seller">
                    Penjual Mencurigakan / Indikasi Penipuan
                  </option>
                  <option value="inappropriate_content">
                    Foto Tidak Relevan / Konten Tidak Pantas
                  </option>
                  <option value="spam">Iklan Duplikat / Spam</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan Tambahan
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Tuliskan bukti atau alasan mengapa iklan ini perlu ditinjau Admin..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50"
                >
                  {reportSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
