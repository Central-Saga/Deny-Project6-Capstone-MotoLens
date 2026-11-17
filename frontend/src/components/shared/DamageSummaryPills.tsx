import React from 'react';

interface DamageSummaryPillsProps {
  scratch: number;
  dent: number;
  accident: number;
  compact?: boolean;
}

export function DamageSummaryPills({
  scratch,
  dent,
  accident,
  compact = false,
}: DamageSummaryPillsProps) {
  const pillBase = compact
    ? 'px-2 py-0.5 text-[11px] rounded font-medium'
    : 'px-2.5 py-1 text-xs rounded-md font-medium';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`${pillBase} ${
          scratch > 0
            ? 'bg-sky-50 text-sky-800 border border-sky-200'
            : 'bg-slate-50 text-slate-500 border border-slate-200'
        }`}
      >
        Scratch: <strong>{scratch}</strong>
      </span>
      <span
        className={`${pillBase} ${
          dent > 0
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-slate-50 text-slate-500 border border-slate-200'
        }`}
      >
        Dent: <strong>{dent}</strong>
      </span>
      <span
        className={`${pillBase} ${
          accident > 0
            ? 'bg-rose-50 text-rose-800 border border-rose-200'
            : 'bg-slate-50 text-slate-500 border border-slate-200'
        }`}
      >
        Accident: <strong>{accident}</strong>
      </span>
    </div>
  );
}
