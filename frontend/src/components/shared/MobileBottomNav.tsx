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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950 border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      <Link
        href="/"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold ${
          pathname === '/' ? 'text-red-500' : 'text-zinc-400'
        }`}
      >
        <Bike className="w-5 h-5" />
        <span>Katalog</span>
      </Link>

      <Link
        href="/compare"
        className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold ${
          pathname.startsWith('/compare') ? 'text-red-500' : 'text-zinc-400'
        }`}
      >
        <Scale className="w-5 h-5" />
        <span>Komparasi</span>
        {items.length > 0 && (
          <span className="absolute top-0 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {items.length}
          </span>
        )}
      </Link>

      <Link
        href="/inspect-simulator"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold ${
          pathname.startsWith('/inspect-simulator')
            ? 'text-red-500'
            : 'text-zinc-400'
        }`}
      >
        <ScanLine className="w-5 h-5" />
        <span>Inspeksi AI</span>
      </Link>

      <Link
        href={isAuthenticated ? '/garasi-saya' : '/login'}
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold ${
          pathname.startsWith('/garasi-saya') || pathname === '/login'
            ? 'text-red-500'
            : 'text-zinc-400'
        }`}
      >
        <Warehouse className="w-5 h-5" />
        <span>{isAuthenticated ? 'Garasi' : 'Masuk'}</span>
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold ${
            pathname.startsWith('/admin') ? 'text-amber-400' : 'text-zinc-400'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>Admin</span>
        </Link>
      )}
    </nav>
  );
}
