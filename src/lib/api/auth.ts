import { apiRequest } from './client';
import type { AuthResponse, LoginPayload, RegisterPayload } from './types';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>({
    url: '/auth/login',
    method: 'POST',
    data: payload,
  });
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>({
    url: '/auth/signup',
    method: 'POST',
    data: payload,
  });
}

export async function getProfile(): Promise<{ user: AuthResponse['user'] }> {
  return apiRequest<{ user: AuthResponse['user'] }>({
    url: '/auth/profile',
    method: 'GET',
  });
}
