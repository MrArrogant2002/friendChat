export const SOCKET_EVENTS = {
  chatMessage: 'chatMessage',
  joinChat: 'chat:join',
  leaveChat: 'chat:leave',
  typing: 'chat:typing',
} as const;

type ValueOf<T> = T[keyof T];

export type SocketEventName = ValueOf<typeof SOCKET_EVENTS>;
