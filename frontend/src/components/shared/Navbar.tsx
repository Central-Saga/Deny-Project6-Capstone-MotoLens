'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Bike,
  CheckCheck,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  ScanLine,
  Shield,
  User as UserIcon,
  Warehouse,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCompare } from '@/hooks/useCompare';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateTimeWita } from '@/utils/formatters';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { items: compareItems } = useCompare();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Katalog Showroom', icon: Bike },
    { href: '/compare', label: 'Komparasi', icon: Scale, badge: compareItems.length },
    { href: '/inspect-simulator', label: 'Simulasi Inspeksi AI', icon: ScanLine },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30 group-hover:bg-red-500 transition">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white">
              MOTO<span className="text-red-500">LENS</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-red-600/20 text-red-400 rounded-full border border-red-500/30">
              AI Dealership Bali
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  active
                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                      active ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {isAuthenticated && (
            <Link
              href="/garasi-saya"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                pathname.startsWith('/garasi-saya')
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Warehouse className="w-4 h-4" />
              <span>Garasi Saya</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                pathname.startsWith('/admin')
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-amber-400 hover:bg-zinc-900 border border-amber-500/30'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Right Actions: Notifications, Favorites, Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Favorites Shortcut */}
              <Link
                href="/garasi-saya?tab=favorites"
                className="p-2 rounded-xl text-zinc-300 hover:text-red-500 hover:bg-zinc-900 transition"
                title="Motor Favorit Saya"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Notification Bell Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    const next = !notifOpen;
                    setNotifOpen(next);
                    if (next) refreshNotifications();
                  }}
                  className="relative p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition"
                  aria-label="Notifikasi"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Notifikasi
                        </h4>
                        <p className="text-xs text-slate-500">
                          {unreadCount} pesan belum dibaca
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Tandai Semua Dibaca</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 px-4 text-center text-xs text-slate-500">
                          Belum ada notifikasi untuk akun Anda.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.is_read) {
                                markAsRead(notif.id);
                              }
                            }}
                            className={`p-3.5 text-left transition cursor-pointer ${
                              notif.is_read
                                ? 'bg-white hover:bg-slate-50'
                                : 'bg-red-50/50 hover:bg-red-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {notif.title}
                              </span>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                            <span className="block text-[10px] text-slate-400 mt-1.5">
                              {formatDateTimeWita(notif.created_at)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Pill */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-800">
                <div className="text-right">
                  <p className="text-xs font-bold text-white truncate max-w-[130px]">
                    {user?.name}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                    {isAdmin ? 'Administrator' : 'Member'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition"
                  title="Keluar (Logout)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-zinc-900 transition"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 transition"
              >
                Daftar
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-300 hover:bg-zinc-900"
            aria-label="Menu navigasi"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-4 py-3 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-red-500" />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-600 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          {isAuthenticated && (
            <>
              <Link
                href="/garasi-saya"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
              >
                <Warehouse className="w-4 h-4 text-red-500" />
                <span>Garasi & Survei Saya</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-400 bg-amber-500/10"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  <span>Dashboard Admin</span>
                </Link>
              )}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-bold text-white">
                    {user?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-semibold text-red-400"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
