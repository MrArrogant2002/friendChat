import type { Message } from '@/lib/api/types';

import { SOCKET_EVENTS } from './events';

export type ServerToClientEvents = {
  [SOCKET_EVENTS.chatMessage]: (message: Message) => void;
};

export type ClientToServerEvents = {
  [SOCKET_EVENTS.joinChat]: (payload: { chatId: string }) => void;
  [SOCKET_EVENTS.leaveChat]: (payload: { chatId: string }) => void;
  [SOCKET_EVENTS.typing]?: (payload: { chatId: string; isTyping: boolean }) => void;
};

export type SocketAuthPayload = {
  token?: string | null;
};
