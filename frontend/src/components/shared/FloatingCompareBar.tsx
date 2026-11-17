'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scale, Trash2, X, ArrowRight } from 'lucide-react';
import { useCompare } from '@/hooks/useCompare';
import { formatCurrency } from '@/utils/formatters';

export function FloatingCompareBar() {
  const pathname = usePathname();
  const { items, removeFromCompare, clearCompare, maxItems } = useCompare();

  if (items.length === 0 || pathname === '/compare') {
    return null;
  }

  return (
    <div className="fixed bottom-16 md:bottom-6 inset-x-0 z-30 px-4 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-zinc-950/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-zinc-800 pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-zinc-800">
            <Scale className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-xs font-extrabold">
                Komparasi ({items.length}/{maxItems})
              </p>
              <p className="text-[10px] text-zinc-400">Pilih 2–3 motor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs shrink-0"
              >
                <div className="max-w-[140px]">
                  <p className="font-semibold truncate">{item.title}</p>
                  <p className="text-[10px] text-red-400 font-bold">
                    {formatCurrency(item.seller_price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCompare(item.id)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  title="Hapus dari komparasi"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={clearCompare}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <Link
            href={`/compare?ids=${items.map((i) => i.id).join(',')}`}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              items.length >= 2
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            <span>Bandingkan Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
