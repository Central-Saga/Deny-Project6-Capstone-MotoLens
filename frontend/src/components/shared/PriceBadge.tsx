import React from 'react';
import { TrendingDown, CheckCircle2, TrendingUp } from 'lucide-react';

interface PriceBadgeProps {
  label: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceBadge({ label, size = 'md' }: PriceBadgeProps) {
  const normalized = (label || 'fair_price').toLowerCase();

  const sizeClass =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-xs gap-1'
      : size === 'lg'
        ? 'px-3.5 py-1.5 text-sm gap-2'
        : 'px-3 py-1 text-xs gap-1.5';

  if (normalized === 'good_deal') {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 ${sizeClass}`}
        title="Harga penjual berada di bawah estimasi pasar MotoLens AI"
      >
        <TrendingDown className="w-3.5 h-3.5 shrink-0" />
        <span>Good Deal (Harga Terbaik)</span>
      </span>
    );
  }

  if (normalized === 'overpriced' || normalized === 'above_market') {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 ${sizeClass}`}
        title="Harga penjual berada di atas estimasi pasar MotoLens AI"
      >
        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
        <span>Overpriced (Di Atas Pasar)</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 ${sizeClass}`}
      title="Harga penjual sebanding dengan estimasi wajar MotoLens AI"
    >
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      <span>Fair Price (Harga Wajar)</span>
    </span>
  );
}
