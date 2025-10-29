import { io, type Socket } from 'socket.io-client';

import { SOCKET_URL } from '@/config/env';

import type { ClientToServerEvents, ServerToClientEvents } from './types';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let activeToken: string | null = null;

function createSocketInstance(
  token: string | null
): Socket<ServerToClientEvents, ClientToServerEvents> {
  const instance = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    auth: token ? { token } : undefined,
    timeout: 10000, // 10 second connection timeout
    reconnectionDelay: 1000, // Start reconnection after 1 second
    reconnectionDelayMax: 5000, // Max 5 seconds between reconnection attempts
    reconnectionAttempts: 5, // Try 5 times before giving up
  }) as Socket<ServerToClientEvents, ClientToServerEvents>;

  activeToken = token;
  return instance;
}

export function ensureSocket(
  token?: string | null
): Socket<ServerToClientEvents, ClientToServerEvents> {
  const normalizedToken = token ?? null;

  if (socket) {
    if (normalizedToken === activeToken) {
      return socket;
    }

    socket.disconnect();
    socket = null;
    activeToken = null;
  }

  socket = createSocketInstance(normalizedToken);
  return socket;
}

export function connectSocket(
  token?: string | null
): Socket<ServerToClientEvents, ClientToServerEvents> {
  const instance = ensureSocket(token);

  if (!instance.connected) {
    instance.connect();
  }

  return instance;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  activeToken = null;
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  return socket;
}
