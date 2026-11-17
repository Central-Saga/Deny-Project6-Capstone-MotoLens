import type { ApiSuccessResponse } from '@/types/api';
import type {
  MotorcycleInspection,
  SourceType,
  SubmitInspectionFeedbackPayload,
} from '@/types/inspection';
import type { TaxStatus } from '@/types/motorcycle';
import { apiRequest } from './apiClient';

export interface RunInspectionPayload {
  photo: File;
  motorcycle_model_id: number;
  year: number;
  odometer_km: number;
  tax_status: TaxStatus;
  seller_price?: number;
  source_type?: SourceType;
}

export const inspectionService = {
  async inspect(
    payload: RunInspectionPayload
  ): Promise<ApiSuccessResponse<MotorcycleInspection>> {
    const formData = new FormData();
    formData.append('photo', payload.photo);
    formData.append('motorcycle_model_id', String(payload.motorcycle_model_id));
    formData.append('year', String(payload.year));
    formData.append('odometer_km', String(payload.odometer_km));
    formData.append('tax_status', payload.tax_status);
    formData.append('source_type', payload.source_type || 'web_upload');

    if (payload.seller_price && payload.seller_price > 0) {
      formData.append('seller_price', String(payload.seller_price));
    }

    return apiRequest<MotorcycleInspection>('/motorcycles/inspect', {
      method: 'POST',
      body: formData,
    });
  },

  async getById(
    id: number | string
  ): Promise<ApiSuccessResponse<MotorcycleInspection>> {
    return apiRequest<MotorcycleInspection>(`/inspections/${id}`, {
      method: 'GET',
    });
  },

  async getByMotorcycle(
    motorcycleId: number | string
  ): Promise<ApiSuccessResponse<MotorcycleInspection[]>> {
    return apiRequest<MotorcycleInspection[]>(
      `/motorcycles/${motorcycleId}/inspections`,
      {
        method: 'GET',
      }
    );
  },

  async submitFeedback(
    inspectionId: number,
    payload: SubmitInspectionFeedbackPayload
  ): Promise<ApiSuccessResponse<unknown>> {
    return apiRequest(`/inspections/${inspectionId}/feedback`, {
      method: 'POST',
      body: payload,
    });
  },
};
