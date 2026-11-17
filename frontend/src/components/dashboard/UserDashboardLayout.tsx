'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Bike,
  CalendarCheck,
  CalendarClock,
  Compass,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationDropdown } from '@/components/shared/NotificationDropdown';

interface UserDashboardLayoutProps {
  children: React.ReactNode;
}

export function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentTab = searchParams.get('tab') || 'overview';
  const isTambahPage = pathname === '/garasi-saya/tambah';

  const menuItems = [
    {
      id: 'overview',
      label: 'Ringkasan & Statistik',
      href: '/garasi-saya?tab=overview',
      icon: LayoutDashboard,
      isActive: !isTambahPage && currentTab === 'overview',
    },
    {
      id: 'listings',
      label: 'Motor Saya',
      href: '/garasi-saya?tab=listings',
      icon: Bike,
      isActive: !isTambahPage && currentTab === 'listings',
    },
    {
      id: 'tambah',
      label: '+ Jual / Tambah Motor',
      href: '/garasi-saya/tambah',
      icon: PlusCircle,
      isActive: isTambahPage,
      highlight: true,
    },
    {
      id: 'seller_inquiries',
      label: 'Jadwal Survei Masuk',
      href: '/garasi-saya?tab=seller_inquiries',
      icon: CalendarCheck,
      isActive: !isTambahPage && currentTab === 'seller_inquiries',
    },
    {
      id: 'buyer_inquiries',
      label: 'Jadwal Survei Keluar',
      href: '/garasi-saya?tab=buyer_inquiries',
      icon: CalendarClock,
      isActive: !isTambahPage && currentTab === 'buyer_inquiries',
    },
    {
      id: 'favorites',
      label: 'Motor Favorit Saya',
      href: '/garasi-saya?tab=favorites',
      icon: Heart,
      isActive: !isTambahPage && currentTab === 'favorites',
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Determine active title
  const getActiveTitle = () => {
    if (isTambahPage) return 'Jual & Terbitkan Listing Motor Baru';
    switch (currentTab) {
      case 'overview':
        return 'Ringkasan & Statistik Garasi';
      case 'listings':
        return 'Daftar Motor & Status Moderasi';
      case 'seller_inquiries':
        return 'Jadwal Survei Masuk (Sebagai Penjual)';
      case 'buyer_inquiries':
        return 'Jadwal Survei Keluar (Sebagai Pembeli)';
      case 'favorites':
        return 'Koleksi Motor Favorit';
      default:
        return 'Garasi Saya';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ============================================================== */}
      {/* DESKTOP LEFT SIDEBAR                                           */}
      {/* ============================================================== */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-40 bg-white border-r border-slate-200">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-none">
                Moto<span className="text-indigo-600">Lens</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Garasi Member
              </span>
            </div>
          </Link>
        </div>

        {/* User Card Mini in Sidebar */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {user?.name || 'Member MotoLens'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {user?.email || 'member@motolens.id'}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  item.isActive
                    ? item.highlight
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-indigo-50 text-indigo-700 font-extrabold'
                    : item.highlight
                    ? 'text-indigo-600 hover:bg-indigo-50/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    item.isActive
                      ? item.highlight
                        ? 'text-white'
                        : 'text-indigo-600'
                      : item.highlight
                      ? 'text-indigo-600'
                      : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-slate-100">
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Akses Khusus
              </span>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Admin Backoffice</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom Actions (Katalog & Logout) */}
        <div className="p-3 border-t border-slate-100 space-y-1 bg-slate-50/50">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition"
          >
            <Compass className="w-4 h-4 text-slate-400" />
            <span>Lihat Katalog Publik</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MOBILE SLIDE-OVER DRAWER                                       */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-black text-slate-900">MotoLens</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.name || 'Member'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || 'member@motolens.id'}
              </p>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      item.isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {isAdmin && (
                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                    <span>Admin Backoffice</span>
                  </Link>
                </div>
              )}
            </nav>

            <div className="p-3 border-t border-slate-100 space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600"
              >
                <Compass className="w-4 h-4" />
                <span>Lihat Katalog Publik</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA & TOP HEADER                                 */}
      {/* ============================================================== */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger on Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Buka navigasi menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                {getActiveTitle()}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Workspace Penjual & Pembeli Terverifikasi AI MotoLens
              </p>
            </div>
          </div>

          {/* Right Header: Notifications & User Profile */}
          <div className="flex items-center gap-3">
            <NotificationDropdown theme="light" />

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                {user?.name ? user.name.slice(0, 1).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden md:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  {user?.name || 'Member'}
                </span>
                <span className="block text-[10px] text-slate-500 leading-none">
                  {isAdmin ? 'Admin & Member' : 'Member Terdaftar'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
