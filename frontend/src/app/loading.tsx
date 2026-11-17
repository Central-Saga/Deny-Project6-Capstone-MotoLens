import React from 'react';
import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-700">
        Memuat data ekosistem MotoLens...
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Menghubungkan ke server REST API `/api/v1`
      </p>
    </div>
  );
}
