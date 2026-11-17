import type { ApiSuccessResponse } from '@/types/api';
import type {
  AuthResponseData,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types/auth';
import { apiRequest, setStoredToken } from './apiClient';

export const authService = {
  async login(payload: LoginPayload): Promise<ApiSuccessResponse<AuthResponseData>> {
    const res = await apiRequest<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: {
        ...payload,
        device_name: payload.device_name || 'motolens-web-nextjs16',
      },
    });
    if (res.data?.token) {
      setStoredToken(res.data.token);
    }
    return res;
  },

  async register(
    payload: RegisterPayload
  ): Promise<ApiSuccessResponse<AuthResponseData>> {
    const res = await apiRequest<AuthResponseData>('/auth/register', {
      method: 'POST',
      body: payload,
    });
    if (res.data?.token) {
      setStoredToken(res.data.token);
    }
    return res;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest<null>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      setStoredToken(null);
    }
  },

  async me(): Promise<ApiSuccessResponse<User>> {
    return apiRequest<User>('/auth/me', {
      method: 'GET',
    });
  },
};
