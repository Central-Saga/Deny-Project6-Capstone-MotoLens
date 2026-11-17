export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  phone_whatsapp: string | null;
  avatar_url: string | null;
  is_active: boolean;
  roles: UserRole[];
  created_at?: string;
}

export interface AuthResponseData {
  user: User;
  token: string;
  token_type: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone_whatsapp: string;
}
