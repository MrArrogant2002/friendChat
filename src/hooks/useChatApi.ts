import { useCallback } from 'react';

import { fetchChatRooms, fetchMessages, postMessage } from '@/lib/api/chat';
import type { ChatSummary, Message, SendMessagePayload } from '@/lib/api/types';
import { useApiMutation } from './useApiMutation';
import { useApiQuery, type ApiQueryOptions } from './useApiQuery';

export function useMessagesQuery(chatId: string, options: ApiQueryOptions = {}) {
  const queryFn = useCallback(() => fetchMessages(chatId), [chatId]);

  return useApiQuery<Message[]>(['messages', chatId], queryFn, options);
}

export function useSendMessageMutation() {
  return useApiMutation<SendMessagePayload, Message>(postMessage);
}

export function useChatRoomsQuery(options: ApiQueryOptions = {}) {
  const queryFn = useCallback(() => fetchChatRooms(), []);

  return useApiQuery<ChatSummary[]>(['chat-rooms'], queryFn, options);
}
