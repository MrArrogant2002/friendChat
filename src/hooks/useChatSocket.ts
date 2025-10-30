import { useCallback, useEffect, useRef, useState } from 'react';

import type { Message } from '@/lib/api/types';
import { connectSocket } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';

import { useSession } from './useSession';

export type ChatSocketStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export type PendingMessage = {
  tempId: string;
  chatId: string;
  content?: string;
  attachments?: any[];
  createdAt: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
};

export type UseChatSocketOptions = {
  enabled?: boolean;
  onMessage?: (message: Message) => void;
  onPendingMessageUpdate?: (tempId: string, serverId: string) => void;
};

export function useChatSocket(
  chatId: string | null | undefined,
  options: UseChatSocketOptions = {}
): {
  status: ChatSocketStatus;
  error: Error | null;
  sendPendingMessage: (message: Omit<PendingMessage, 'status'>) => void;
  pendingMessages: PendingMessage[];
} {
  const { enabled = true, onMessage, onPendingMessageUpdate } = options;
  const { token } = useSession();
  const normalizedChatId = chatId ?? '';
  const [status, setStatus] = useState<ChatSocketStatus>(
    enabled && token && normalizedChatId ? 'connecting' : 'idle'
  );
  const [error, setError] = useState<Error | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const handlerRef = useRef<UseChatSocketOptions['onMessage']>(onMessage);
  const updateHandlerRef = useRef<UseChatSocketOptions['onPendingMessageUpdate']>(
    onPendingMessageUpdate
  );
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    updateHandlerRef.current = onPendingMessageUpdate;
  }, [onPendingMessageUpdate]);

  // Function to send pending messages when socket reconnects
  const sendPendingMessagesQueue = useCallback(() => {
    if (!socketRef.current?.connected) return;

    setPendingMessages((prev) => {
      const toSend = prev.filter((msg) => msg.status === 'pending');
      
      toSend.forEach((msg) => {
        if (socketRef.current) {
          // Mark as sending
          setPendingMessages((current) =>
            current.map((m) => (m.tempId === msg.tempId ? { ...m, status: 'sending' as const } : m))
          );

          // Emit the message
          socketRef.current.emit(
            'send-message' as any,
            {
              chatId: msg.chatId,
              content: msg.content,
              attachments: msg.attachments,
              tempId: msg.tempId,
            },
            (response: any) => {
              if (response?.success && response?.message) {
                // Message sent successfully
                setPendingMessages((current) =>
                  current.filter((m) => m.tempId !== msg.tempId)
                );
                updateHandlerRef.current?.(msg.tempId, response.message.id);
              } else {
                // Failed to send
                setPendingMessages((current) =>
                  current.map((m) =>
                    m.tempId === msg.tempId ? { ...m, status: 'failed' as const } : m
                  )
                );
              }
            }
          );
        }
      });

      return prev;
    });
  }, []);

  const sendPendingMessage = useCallback((message: Omit<PendingMessage, 'status'>) => {
    const pendingMsg: PendingMessage = { ...message, status: 'pending' };
    setPendingMessages((prev) => [...prev, pendingMsg]);
  }, []);

  useEffect(() => {
    if (!enabled || !token || !normalizedChatId) {
      setStatus('idle');
      setError(null);
      return;
    }

    const socket = connectSocket(token);
    socketRef.current = socket;

    const handleConnect = () => {
      console.log('[Socket] Connected to chat:', normalizedChatId);
      setStatus('connected');
      setError(null);
      socket.emit(SOCKET_EVENTS.joinChat, { chatId: normalizedChatId });
      
      // Send any pending messages
      sendPendingMessagesQueue();
    };

    const handleDisconnect = (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      setStatus('disconnected');
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      console.log('[Socket] Reconnecting... attempt', attemptNumber);
      setStatus('reconnecting');
    };

    const handleConnectError = (connectError: Error) => {
      console.error('[Socket] Connection error:', connectError);
      setStatus('error');
      setError(connectError);
    };

    const handleMessage = (message: Message) => {
      if (message.chatId !== normalizedChatId) {
        return;
      }
      console.log('[Socket] Received message:', message.id);
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
    socket.on('reconnect_attempt' as any, handleReconnectAttempt);
    socket.on('connect_error', handleConnectError);
    socket.on(SOCKET_EVENTS.chatMessage, handleMessage);

    return () => {
      console.log('[Socket] Cleaning up chat:', normalizedChatId);
      socket.emit(SOCKET_EVENTS.leaveChat, { chatId: normalizedChatId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt' as any, handleReconnectAttempt);
      socket.off('connect_error', handleConnectError);
      socket.off(SOCKET_EVENTS.chatMessage, handleMessage);
      socketRef.current = null;
    };
  }, [enabled, normalizedChatId, token, sendPendingMessagesQueue]);

  return {
    status,
    error,
    sendPendingMessage,
    pendingMessages,
  };
}
