import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="max-w-xl mx-auto my-16 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-7 h-7" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">
          HTTP 404 — Halaman Tidak Ditemukan
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
          Halaman atau Unit Motor Tidak Tersedia
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Unit motor yang Anda cari mungkin telah terjual, diarsipkan oleh
          penjual, atau alamat URL tidak valid.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Jelajahi Katalog Motor</span>
        </Link>
      </div>
    </div>
  );
}
