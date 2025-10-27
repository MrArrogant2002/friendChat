import axios, {
    AxiosHeaders,
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
} from 'axios';

import { API_BASE_URL, API_TIMEOUT } from '@/config/env';

import { normalizeApiError } from './errors';

type UnauthorizedListener = () => void;

type RequestConfig = AxiosRequestConfig;

type Response<TResponse> = AxiosResponse<TResponse>;

let accessToken: string | null = null;
let unauthorizedListener: UnauthorizedListener | null = null;

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: defaultHeaders,
});

client.interceptors.request.use((config) => {
  const configuration = { ...config };

  configuration.headers = AxiosHeaders.from(configuration.headers ?? {});

  if (accessToken && !configuration.headers.has('Authorization')) {
    configuration.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return configuration;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error);

    if (normalized.status === 401 && unauthorizedListener) {
      unauthorizedListener();
    }

    return Promise.reject(normalized);
  }
);

export function setAccessToken(token?: string | null): void {
  accessToken = token ?? null;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedListener(listener: UnauthorizedListener | null): void {
  unauthorizedListener = listener;
}

export async function apiRequest<TResponse>(config: RequestConfig): Promise<TResponse> {
  const response: Response<TResponse> = await client.request<TResponse>(config);
  return response.data;
}

export type { ApiClientError } from './errors';
export { client as apiClient };

