export interface ApiMeta {
  current_page?: number;
  per_page?: number;
  total?: number;
  last_page?: number;
  unread_count?: number;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  data: null;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
