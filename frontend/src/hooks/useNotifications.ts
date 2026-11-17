'use client';

import { useCallback, useEffect, useState } from 'react';
import type { NotificationItem } from '@/types/notification';
import { notificationService } from '@/services/notificationService';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const res = await notificationService.getList(1, 15);
      setNotifications(res.data || []);
      setUnreadCount(Number(res.meta?.unread_count ?? 0));
    } catch {
      // Ignore transient notification fetch errors
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore error
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch {
      // Ignore error
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  };
}
