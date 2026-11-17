import type { ApiSuccessResponse } from '@/types/api';
import type { NotificationItem } from '@/types/notification';
import { apiRequest } from './apiClient';

export const notificationService = {
  async getList(
    page: number = 1,
    perPage: number = 15
  ): Promise<ApiSuccessResponse<NotificationItem[]>> {
    return apiRequest<NotificationItem[]>('/notifications', {
      method: 'GET',
      params: { page, per_page: perPage },
    });
  },

  async markAsRead(id: string): Promise<ApiSuccessResponse<NotificationItem>> {
    return apiRequest<NotificationItem>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllAsRead(): Promise<ApiSuccessResponse<null>> {
    return apiRequest<null>('/notifications/read-all', {
      method: 'POST',
    });
  },
};
