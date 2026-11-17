'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertOctagon,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  LogOut,
  Menu,
  MessageSquareWarning,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationDropdown } from '@/components/shared/NotificationDropdown';

export type AdminActiveTab =
  | 'overview'
  | 'moderation'
  | 'models'
  | 'metrics'
  | 'reports'
  | 'feedbacks'
  | 'logs';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: AdminActiveTab;
  onTabChange: (tab: AdminActiveTab) => void;
  pendingModerationCount?: number;
  pendingReportsCount?: number;
}

export function AdminDashboardLayout({
  children,
  activeTab,
  onTabChange,
  pendingModerationCount = 0,
  pendingReportsCount = 0,
}: AdminDashboardLayoutProps) {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      id: 'overview' as AdminActiveTab,
      label: 'Overview & Analitik Pasar',
      icon: BarChart3,
    },
    {
      id: 'moderation' as AdminActiveTab,
      label: 'Moderasi Listing Motor',
      icon: ShieldCheck,
      badge: pendingModerationCount > 0 ? pendingModerationCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'models' as AdminActiveTab,
      label: 'Master Referensi Harga',
      icon: Database,
    },
    {
      id: 'metrics' as AdminActiveTab,
      label: 'Metrik & Kesehatan ONNX',
      icon: Cpu,
    },
    {
      id: 'reports' as AdminActiveTab,
      label: 'Laporan Listing Motor',
      icon: AlertOctagon,
      badge: pendingReportsCount > 0 ? pendingReportsCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    {
      id: 'feedbacks' as AdminActiveTab,
      label: 'Review Feedback AI',
      icon: MessageSquareWarning,
    },
    {
      id: 'logs' as AdminActiveTab,
      label: 'Audit Log Aktivitas',
      icon: FileText,
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getActiveTabTitle = () => {
    const item = menuItems.find((m) => m.id === activeTab);
    return item ? item.label : 'Admin Backoffice';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* ============================================================== */}
      {/* DESKTOP ADMIN LEFT SIDEBAR (Dark Theme)                         */}
      {/* ============================================================== */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-40 bg-slate-950 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/80">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-900/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block leading-none">
                Moto<span className="text-rose-500">Lens</span>
              </span>
              <span className="text-[9px] font-black tracking-widest text-rose-400 uppercase">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Admin Card Mini */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 font-black flex items-center justify-center text-xs shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-white truncate">
                {user?.name || 'Administrator'}
              </p>
            </div>
            <span className="inline-block text-[9px] font-black uppercase tracking-wider text-rose-400">
              Full Privileges
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Manajemen Sistem
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-white text-rose-700'
                        : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>Ke Halaman Publik (/)</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition text-left"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MOBILE DRAWER (Dark Theme)                                     */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950 text-slate-100 shadow-2xl border-r border-slate-800">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-black text-white">MotoLens Admin</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                      isActive
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-800 space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ke Halaman Publik (/)</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA & TOP ADMIN HEADER                           */}
      {/* ============================================================== */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Admin Header */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Buka navigasi admin"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  {getActiveTabTitle()}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-[10px] font-black text-rose-400 uppercase tracking-wider">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Konsol Operasional & Kontrol Moderasi MotoLens
              </p>
            </div>
          </div>

          {/* Right Header Status & Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* System Status Indicators */}
            <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-semibold">API Server:</span>
                <span className="text-emerald-400 font-mono text-[10px]">Online</span>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-slate-300 font-semibold">ONNX:</span>
                <span className="text-indigo-400 font-mono text-[10px]">Ready</span>
              </div>
            </div>

            {/* Notification Dropdown (Dark Theme) */}
            <NotificationDropdown theme="dark" />

            <div className="h-6 w-px bg-slate-800" />

            {/* Admin Profile */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                {user?.name ? user.name.slice(0, 1).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:block text-left">
                <span className="block text-xs font-bold text-white leading-tight">
                  {user?.name || 'Admin'}
                </span>
                <span className="block text-[10px] text-slate-400 leading-none">
                  Superadmin
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}
