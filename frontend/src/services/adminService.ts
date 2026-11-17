import type {
  ActivityLogItem,
  AdminDashboardData,
  AdminInspectionFeedbackItem,
  AdminInspectionMetrics,
  AdminReportItem,
  ReportStatus,
} from '@/types/admin';
import type { ApiSuccessResponse } from '@/types/api';
import type { FeedbackReviewStatus } from '@/types/inspection';
import type {
  ModerationStatus,
  MotorcycleCategory,
  MotorcycleDetail,
  MotorcycleListItem,
  MotorcycleModelRef,
} from '@/types/motorcycle';
import { apiRequest } from './apiClient';

export interface StoreModelPayload {
  brand: string;
  model_name: string;
  engine_cc: number;
  category: MotorcycleCategory | string;
  standard_price: number;
  price_source?: string;
  is_active?: boolean;
}

export const adminService = {
  async getDashboard(): Promise<ApiSuccessResponse<AdminDashboardData>> {
    return apiRequest<AdminDashboardData>('/admin/dashboard', {
      method: 'GET',
    });
  },

  async getActivityLogs(
    page: number = 1,
    perPage: number = 20,
    logName?: string
  ): Promise<ApiSuccessResponse<ActivityLogItem[]>> {
    return apiRequest<ActivityLogItem[]>('/admin/activity-logs', {
      method: 'GET',
      params: { page, per_page: perPage, log_name: logName },
    });
  },

  async getMotorcycles(
    moderationStatus?: ModerationStatus | string,
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiSuccessResponse<MotorcycleListItem[]>> {
    return apiRequest<MotorcycleListItem[]>('/admin/motorcycles', {
      method: 'GET',
      params: {
        moderation_status: moderationStatus,
        page,
        per_page: perPage,
      },
    });
  },

  async moderateMotorcycle(
    id: number,
    payload: {
      moderation_status: 'approved' | 'rejected';
      rejection_reason?: string;
    }
  ): Promise<ApiSuccessResponse<MotorcycleDetail>> {
    return apiRequest<MotorcycleDetail>(`/admin/motorcycles/${id}/moderation`, {
      method: 'PATCH',
      body: payload,
    });
  },

  async getInspectionMetrics(): Promise<
    ApiSuccessResponse<AdminInspectionMetrics>
  > {
    return apiRequest<AdminInspectionMetrics>('/admin/inspections/metrics', {
      method: 'GET',
    });
  },

  async getReports(
    status?: ReportStatus | string,
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiSuccessResponse<AdminReportItem[]>> {
    return apiRequest<AdminReportItem[]>('/admin/reports', {
      method: 'GET',
      params: { status, page, per_page: perPage },
    });
  },

  async updateReport(
    id: number,
    status: ReportStatus
  ): Promise<ApiSuccessResponse<AdminReportItem>> {
    return apiRequest<AdminReportItem>(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: { status },
    });
  },

  async getInspectionFeedbacks(
    reviewStatus?: FeedbackReviewStatus | string,
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiSuccessResponse<AdminInspectionFeedbackItem[]>> {
    return apiRequest<AdminInspectionFeedbackItem[]>(
      '/admin/inspection-feedbacks',
      {
        method: 'GET',
        params: { review_status: reviewStatus, page, per_page: perPage },
      }
    );
  },

  async updateInspectionFeedback(
    id: number,
    reviewStatus: FeedbackReviewStatus
  ): Promise<ApiSuccessResponse<AdminInspectionFeedbackItem>> {
    return apiRequest<AdminInspectionFeedbackItem>(
      `/admin/inspection-feedbacks/${id}`,
      {
        method: 'PATCH',
        body: { review_status: reviewStatus },
      }
    );
  },

  async createModel(
    payload: StoreModelPayload
  ): Promise<ApiSuccessResponse<MotorcycleModelRef>> {
    return apiRequest<MotorcycleModelRef>('/admin/motorcycle-models', {
      method: 'POST',
      body: payload,
    });
  },

  async updateModel(
    id: number,
    payload: Partial<StoreModelPayload>
  ): Promise<ApiSuccessResponse<MotorcycleModelRef>> {
    return apiRequest<MotorcycleModelRef>(`/admin/motorcycle-models/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async deleteModel(id: number): Promise<ApiSuccessResponse<null>> {
    return apiRequest<null>(`/admin/motorcycle-models/${id}`, {
      method: 'DELETE',
    });
  },
};
