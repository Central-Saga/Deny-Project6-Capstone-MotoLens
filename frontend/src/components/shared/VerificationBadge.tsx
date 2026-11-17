import React from 'react';
import { Camera, Globe, Database } from 'lucide-react';

interface VerificationBadgeProps {
  sourceType?: string | null;
  isCameraVerified?: boolean;
}

export function VerificationBadge({
  sourceType,
  isCameraVerified,
}: VerificationBadgeProps) {
  const normalized = (
    sourceType || (isCameraVerified ? 'android_camera' : 'seed_demo')
  ).toLowerCase();

  if (normalized === 'android_camera') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200"
        title="Foto diambil langsung dari kamera belakang aplikasi Android MotoLens dengan metadata GPS"
      >
        <Camera className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span>Camera Verified (Android)</span>
      </span>
    );
  }

  if (normalized === 'web_upload') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
        title="Foto diunggah melalui fitur Simulasi Inspeksi Web (bukan tangkapan kamera terverifikasi)"
      >
        <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Simulasi Inspeksi Web</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300"
      title="Data katalog demonstrasi (Seed Demo)"
    >
      <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <span>Data Demo (Seed)</span>
    </span>
  );
}
