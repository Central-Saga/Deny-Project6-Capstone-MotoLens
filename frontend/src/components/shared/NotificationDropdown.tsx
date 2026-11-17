'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateTimeWita } from '@/utils/formatters';
import type { NotificationItem } from '@/types/notification';

interface NotificationDropdownProps {
  theme?: 'light' | 'dark';
}

export function NotificationDropdown({ theme = 'light' }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inquiry_new':
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      case 'inquiry_status':
        return <Check className="w-4 h-4 text-emerald-500" />;
      case 'moderation_approved':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'moderation_rejected':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) refreshNotifications();
        }}
        className={`relative p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 ${
          isDark
            ? 'text-slate-300 hover:text-white hover:bg-slate-800 focus:ring-indigo-500'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-indigo-600'
        }`}
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/60'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Notifikasi
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className={`text-[11px] font-semibold flex items-center gap-1 transition ${
                  isDark
                    ? 'text-indigo-400 hover:text-indigo-300'
                    : 'text-indigo-600 hover:text-indigo-700'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai semua dibaca</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mb-1 text-indigo-500" />
                <span>Memuat notifikasi...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada notifikasi aktivitas.
              </div>
            ) : (
              notifications.map((n: NotificationItem) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markAsRead(n.id);
                  }}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                    !n.is_read
                      ? isDark
                        ? 'bg-slate-800/40 hover:bg-slate-800/70'
                        : 'bg-indigo-50/50 hover:bg-indigo-50'
                      : isDark
                      ? 'hover:bg-slate-800/30'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-slate-800' : 'bg-slate-100'
                      }`}
                    >
                      {getNotificationIcon(n.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p
                        className={`text-xs font-bold leading-snug truncate ${
                          !n.is_read
                            ? isDark
                              ? 'text-white'
                              : 'text-slate-900'
                            : isDark
                            ? 'text-slate-400'
                            : 'text-slate-600'
                        }`}
                      >
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <p
                      className={`text-[11px] leading-relaxed line-clamp-2 mt-0.5 ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {n.message || 'Pemberitahuan baru dari MotoLens.'}
                    </p>
                    <p
                      className={`text-[10px] mt-1.5 ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {formatDateTimeWita(n.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div
            className={`p-2.5 text-center border-t text-[11px] font-semibold ${
              isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-100 bg-slate-50'
            }`}
          >
            <Link
              href="/garasi-saya?tab=seller_inquiries"
              onClick={() => setIsOpen(false)}
              className={`inline-flex items-center gap-1 ${
                isDark
                  ? 'text-indigo-400 hover:text-indigo-300'
                  : 'text-indigo-600 hover:text-indigo-700'
              }`}
            >
              <span>Pantau Jadwal Survei & Aktivitas</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
