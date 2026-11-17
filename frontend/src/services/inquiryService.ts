import type { ApiSuccessResponse } from '@/types/api';
import type { CreateInquiryPayload, InquiryItem } from '@/types/inquiry';
import { apiRequest } from './apiClient';

export const inquiryService = {
  async getList(
    role?: 'buyer' | 'seller',
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiSuccessResponse<InquiryItem[]>> {
    return apiRequest<InquiryItem[]>('/inquiries', {
      method: 'GET',
      params: { role, page, per_page: perPage },
    });
  },

  async create(
    payload: CreateInquiryPayload
  ): Promise<ApiSuccessResponse<InquiryItem>> {
    return apiRequest<InquiryItem>('/inquiries', {
      method: 'POST',
      body: payload,
    });
  },

  async updateStatus(
    id: number,
    status: 'accepted' | 'rejected' | 'completed'
  ): Promise<ApiSuccessResponse<InquiryItem>> {
    return apiRequest<InquiryItem>(`/inquiries/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  async cancel(id: number): Promise<ApiSuccessResponse<InquiryItem>> {
    return apiRequest<InquiryItem>(`/inquiries/${id}/cancel`, {
      method: 'POST',
    });
  },
};
