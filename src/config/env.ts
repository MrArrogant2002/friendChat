import { Platform } from 'react-native';

const fallbackHttpOrigin = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

const rawApiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const resolvedFallbackOrigin = fallbackHttpOrigin ?? 'http://localhost:3000';
const baseApiUrl = rawApiUrl.length > 0 ? rawApiUrl : `${resolvedFallbackOrigin}/api`;
const normalizedApiUrl = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

const parsedApiUrl = parseUrl(normalizedApiUrl);

const fallbackSocketUrl = (() => {
  if (parsedApiUrl) {
    const protocol = parsedApiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${parsedApiUrl.host}`;
  }

  const fallbackHost = resolvedFallbackOrigin.replace(/^https?:\/\//, '');
  const protocol = resolvedFallbackOrigin.startsWith('https') ? 'wss:' : 'ws:';
  return `${protocol}//${fallbackHost}`;
})();

const rawSocketUrl = (process.env.EXPO_PUBLIC_SOCKET_URL ?? '').replace(/\/$/, '');

export const API_BASE_URL = normalizedApiUrl;
export const API_TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 15000);
export const SOCKET_URL = rawSocketUrl.length > 0 ? rawSocketUrl : fallbackSocketUrl;

export function resolveApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export function resolveSocketUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SOCKET_URL}${normalized}`;
}
