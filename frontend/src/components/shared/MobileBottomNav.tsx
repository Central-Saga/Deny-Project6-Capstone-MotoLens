'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bike, Scale, ScanLine, Warehouse, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCompare } from '@/hooks/useCompare';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin } = useAuth();
  const { items } = useCompare();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      <Link
        href="/"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${
          pathname === '/' ? 'text-indigo-600' : 'text-slate-500'
        }`}
      >
        <Bike className="w-5 h-5" />
        <span>Katalog</span>
      </Link>

      <Link
        href="/compare"
        className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${
          pathname.startsWith('/compare') ? 'text-indigo-600' : 'text-slate-500'
        }`}
      >
        <Scale className="w-5 h-5" />
        <span>Komparasi</span>
        {items.length > 0 && (
          <span className="absolute top-0 right-1 min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
            {items.length}
          </span>
        )}
      </Link>

      <Link
        href="/inspect-simulator"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${
          pathname.startsWith('/inspect-simulator')
            ? 'text-indigo-600'
            : 'text-slate-500'
        }`}
      >
        <ScanLine className="w-5 h-5" />
        <span>Inspeksi AI</span>
      </Link>

      <Link
        href={isAuthenticated ? '/garasi-saya' : '/login'}
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${
          pathname.startsWith('/garasi-saya') || pathname === '/login'
            ? 'text-indigo-600'
            : 'text-slate-500'
        }`}
      >
        <Warehouse className="w-5 h-5" />
        <span>{isAuthenticated ? 'Garasi' : 'Masuk'}</span>
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${
            pathname.startsWith('/admin') ? 'text-amber-600' : 'text-slate-500'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>Admin</span>
        </Link>
      )}
    </nav>
  );
}
