import React from 'react';
import Link from 'next/link';
import { Bike, ShieldCheck, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800 mt-16 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-800">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-md shadow-red-600/30">
                <Bike className="w-5 h-5" />
              </div>
              <span className="text-lg font-black tracking-tight">
                MOTO<span className="text-red-500">LENS</span> SHOWROOM
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400 max-w-md">
              Platform showroom dan inspeksi bodi motor bekas berbasis Computer Vision
              (YOLOv8n ONNX Runtime) dengan kalkulasi taksiran harga transparan
              (<em>Explainable Price Breakdown</em>) untuk pasar motor bekas di Bali.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                <Cpu className="w-3.5 h-3.5 text-red-500" />
                <span>Model: YOLOv8n ONNX (mAP@50: 84.34%)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zona Waktu: WITA (Asia/Makassar)</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">
              Navigasi Showroom
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-red-400 transition">
                  Katalog Motor Bekas
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-red-400 transition">
                  Komparasi 2–3 Unit
                </Link>
              </li>
              <li>
                <Link
                  href="/inspect-simulator"
                  className="hover:text-red-400 transition"
                >
                  Simulasi Inspeksi Web AI
                </Link>
              </li>
              <li>
                <Link
                  href="/garasi-saya"
                  className="hover:text-red-400 transition"
                >
                  Garasi Saya & Jadwal Survei
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">
              Disclaimer Keterbatasan AI
            </h4>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Deteksi AI MotoLens hanya memeriksa anomali bodi luar (<em>Scratch</em>,
              <em>Dent</em>, <em>Accident</em>) dari foto visual. Sistem tidak memeriksa
              kondisi mesin internal, rangka tersembunyi, kelistrikan, atau
              keabsahan dokumen STNK/BPKB. Wajib lakukan survei fisik sebelum
              bertransaksi.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} MotoLens Capstone Project. All rights reserved.</p>
          <p>Next.js 16 App Router • Laravel 13 Sanctum API • ONNX Runtime</p>
        </div>
      </div>
    </footer>
  );
}
