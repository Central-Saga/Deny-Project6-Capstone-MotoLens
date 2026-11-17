import React from 'react';
import { ShieldCheck, AlertCircle, Wrench } from 'lucide-react';

interface ConditionBadgeProps {
  grade: string | null | undefined;
  showDescription?: boolean;
}

export function ConditionBadge({
  grade,
  showDescription = false,
}: ConditionBadgeProps) {
  const normalized = (grade || 'mulus').toLowerCase();

  if (normalized === 'mulus' || normalized === 'a') {
    return (
      <div className="inline-flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Kondisi: Mulus (Grade A)</span>
        </span>
        {showDescription && (
          <span className="text-[11px] text-slate-500">
            Minim anomali bodi visual berdasarkan deteksi YOLOv8
          </span>
        )}
      </div>
    );
  }

  if (normalized === 'perlu_perbaikan' || normalized === 'c' || normalized === 'd') {
    return (
      <div className="inline-flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 w-fit">
          <Wrench className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Kondisi: Perlu Perbaikan (Grade C)</span>
        </span>
        {showDescription && (
          <span className="text-[11px] text-slate-500">
            Terdeteksi indikasi penyok/benturan signifikan pada bodi luar
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 w-fit">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Kondisi: Lecet Ringan (Grade B)</span>
      </span>
      {showDescription && (
        <span className="text-[11px] text-slate-500">
          Terdeteksi goresan/lecet pemakaian wajar pada bodi luar
        </span>
      )}
    </div>
  );
}
