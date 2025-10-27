import { useEffect, useRef, useState } from 'react';

import type { Message } from '@/lib/api/types';
import { connectSocket } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';

import { useSession } from './useSession';

export type ChatSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export type UseChatSocketOptions = {
  enabled?: boolean;
  onMessage?: (message: Message) => void;
};

export function useChatSocket(
  chatId: string | null | undefined,
  options: UseChatSocketOptions = {}
): {
  status: ChatSocketStatus;
  error: Error | null;
} {
  const { enabled = true, onMessage } = options;
  const { token } = useSession();
  const normalizedChatId = chatId ?? '';
  const [status, setStatus] = useState<ChatSocketStatus>(
    enabled && token && normalizedChatId ? 'connecting' : 'idle'
  );
  const [error, setError] = useState<Error | null>(null);
  const handlerRef = useRef<UseChatSocketOptions['onMessage']>(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !token || !normalizedChatId) {
      setStatus('idle');
      setError(null);
      return;
    }

    const socket = connectSocket(token);

    const handleConnect = () => {
      setStatus('connected');
      setError(null);
      socket.emit(SOCKET_EVENTS.joinChat, { chatId: normalizedChatId });
    };

    const handleDisconnect = () => {
      setStatus('disconnected');
    };

    const handleConnectError = (connectError: Error) => {
      setStatus('error');
      setError(connectError);
    };

    const handleMessage = (message: Message) => {
      if (message.chatId !== normalizedChatId) {
        return;
      }
      handlerRef.current?.(message);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      setStatus('connecting');
      socket.connect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on(SOCKET_EVENTS.chatMessage, handleMessage);

    return () => {
      socket.emit(SOCKET_EVENTS.leaveChat, { chatId: normalizedChatId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off(SOCKET_EVENTS.chatMessage, handleMessage);
    };
  }, [enabled, normalizedChatId, token]);

  return {
    status,
    error,
  };
}
