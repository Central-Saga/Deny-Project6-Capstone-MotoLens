import type { ApiMeta, ApiSuccessResponse } from '@/types/api';

const DEFAULT_API_URL = 'http://localhost:8000/api/v1';

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
}

const TOKEN_STORAGE_KEY = 'motolens_auth_token';

/**
 * Catatan Keamanan (PRD Bab 8 Fase 2 Poin 10):
 * Token Bearer Sanctum disimpan pada session/local storage browser untuk arsitektur
 * decoupled SPA/Mobile API (/api/v1). Untuk mitigasi XSS, seluruh input ditampilkan melalui
 * auto-escaping JSX React, tanpa penggunaan dangerouslySetInnerHTML pada data user,
 * serta token langsung dihapus saat logout atau menerima HTTP 401.
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export class ApiClientError extends Error {
  public status: number;
  public errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number = 500,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiSuccessResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${baseUrl}${cleanEndpoint}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        url.searchParams.set(key, String(val));
      }
    });
  }

  const token = options.token !== undefined ? options.token : getStoredToken();
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...options,
      headers,
      body: isFormData
        ? (options.body as FormData)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      cache: options.cache ?? 'no-store',
    });
  } catch {
    throw new ApiClientError(
      'Tidak dapat terhubung ke server API MotoLens. Pastikan server Laravel sedang berjalan di port 8000.',
      0
    );
  }

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || (payload && payload.success === false)) {
    if (response.status === 401 && typeof window !== 'undefined') {
      setStoredToken(null);
    }

    const message =
      (payload && typeof payload.message === 'string' && payload.message) ||
      `Terjadi kesalahan pada permintaan (${response.status}).`;
    const errors =
      payload && typeof payload.errors === 'object' && payload.errors !== null
        ? (payload.errors as Record<string, string[]>)
        : undefined;

    throw new ApiClientError(message, response.status, errors);
  }

  return {
    success: true,
    message: (payload?.message as string) || 'Berhasil',
    data: (payload?.data as T) ?? ({} as T),
    meta: (payload?.meta as ApiMeta) || {},
  };
}
