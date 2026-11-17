import React from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse">
      <div className="h-48 bg-slate-200 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between gap-2">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-5 bg-slate-200 rounded w-1/4" />
        </div>
        <div className="h-6 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
          <div className="h-7 bg-slate-200 rounded w-2/5" />
          <div className="h-8 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-500">
        <Inbox className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mb-5">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Gagal Memuat Data',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-rose-50/70 rounded-2xl border border-rose-200">
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-3 text-rose-600">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-rose-950 mb-1">{title}</h3>
      <p className="text-sm text-rose-800 max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Lagi</span>
        </button>
      )}
    </div>
  );
}
