'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('MotoLens Web Error:', error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto my-16 px-4">
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">
          Terjadi Gangguan pada Halaman Ini
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {error.message ||
            'Kami mengalami kendala saat memproses permintaan Anda. Silakan muat ulang halaman atau kembali ke katalog utama.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Muat Ulang</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
