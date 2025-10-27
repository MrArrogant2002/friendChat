import { setAccessToken } from './client';

import { disconnectSocket } from '@/lib/socket/client';
import type { ApiUser, AuthResponse } from './types';

type SessionListener = (session: AuthSession) => void;

type AuthSession = {
  token: string | null;
  user: ApiUser | null;
};

let currentSession: AuthSession = {
  token: null,
  user: null,
};

const listeners = new Set<SessionListener>();

function emitChange(): void {
  listeners.forEach((listener) => {
    listener(currentSession);
  });
}

export function subscribe(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSession(): AuthSession {
  return currentSession;
}

export function setSession(response: AuthResponse): void {
  currentSession = {
    token: response.token,
    user: response.user,
  };
  setAccessToken(response.token);
  emitChange();
}

export function clearSession(): void {
  currentSession = {
    token: null,
    user: null,
  };
  setAccessToken(null);
  disconnectSocket();
  emitChange();
}
