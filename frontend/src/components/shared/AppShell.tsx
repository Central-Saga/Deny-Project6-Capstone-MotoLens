'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';
import { FloatingCompareBar } from '@/components/shared/FloatingCompareBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // Route dashboards use their own dedicated left-sidebar layouts
  const isDashboardRoute =
    pathname?.startsWith('/garasi-saya') || pathname?.startsWith('/admin');

  if (isDashboardRoute) {
    return <>{children}</>;
  }

  // Public Layout: Top Navbar & Footer for full-width catalogs, certificates, and comparison
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">{children}</main>
      <FloatingCompareBar />
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
