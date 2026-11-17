import type { ApiSuccessResponse } from '@/types/api';
import type {
  CatalogFilterParams,
  MotorcycleDetail,
  MotorcycleListItem,
  MotorcycleModelRef,
  ReportListingPayload,
  UpdateMotorcyclePayload,
} from '@/types/motorcycle';
import { apiRequest } from './apiClient';

export interface PublishListingPayload {
  inspection_id: number;
  title: string;
  description?: string;
  seller_price: number;
  location_address: string;
  latitude?: number;
  longitude?: number;
}

export const motorcycleService = {
  async getModels(params?: {
    brand?: string;
    category?: string;
    search?: string;
  }): Promise<ApiSuccessResponse<MotorcycleModelRef[]>> {
    return apiRequest<MotorcycleModelRef[]>('/motorcycle-models', {
      method: 'GET',
      params,
    });
  },

  async getCatalog(
    params?: CatalogFilterParams
  ): Promise<ApiSuccessResponse<MotorcycleListItem[]>> {
    return apiRequest<MotorcycleListItem[]>('/motorcycles', {
      method: 'GET',
      params: params as Record<string, string | number | undefined>,
    });
  },

  async getById(
    id: number | string
  ): Promise<ApiSuccessResponse<MotorcycleDetail>> {
    return apiRequest<MotorcycleDetail>(`/motorcycles/${id}`, {
      method: 'GET',
    });
  },

  async compare(
    ids: Array<number | string>
  ): Promise<ApiSuccessResponse<MotorcycleDetail[]>> {
    return apiRequest<MotorcycleDetail[]>('/motorcycles/compare', {
      method: 'GET',
      params: { ids: ids.join(',') },
    });
  },

  async getMyMotorcycles(
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiSuccessResponse<MotorcycleListItem[]>> {
    return apiRequest<MotorcycleListItem[]>('/my-motorcycles', {
      method: 'GET',
      params: { page, per_page: perPage },
    });
  },

  async create(
    payload: PublishListingPayload
  ): Promise<ApiSuccessResponse<MotorcycleDetail>> {
    return apiRequest<MotorcycleDetail>('/motorcycles', {
      method: 'POST',
      body: payload,
    });
  },

  async update(
    id: number,
    payload: UpdateMotorcyclePayload
  ): Promise<ApiSuccessResponse<MotorcycleDetail>> {
    return apiRequest<MotorcycleDetail>(`/motorcycles/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  async remove(id: number): Promise<ApiSuccessResponse<null>> {
    return apiRequest<null>(`/motorcycles/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleFavorite(
    id: number
  ): Promise<ApiSuccessResponse<{ motorcycle_id: number; is_favorited: boolean }>> {
    return apiRequest<{ motorcycle_id: number; is_favorited: boolean }>(
      `/motorcycles/${id}/favorite`,
      {
        method: 'POST',
      }
    );
  },

  async getFavorites(
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiSuccessResponse<MotorcycleListItem[]>> {
    return apiRequest<MotorcycleListItem[]>('/favorites', {
      method: 'GET',
      params: { page, per_page: perPage },
    });
  },

  async reportListing(
    id: number,
    payload: ReportListingPayload
  ): Promise<ApiSuccessResponse<unknown>> {
    return apiRequest(`/motorcycles/${id}/reports`, {
      method: 'POST',
      body: payload,
    });
  },
};
