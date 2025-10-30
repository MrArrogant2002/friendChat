import { useCallback, useEffect, useState } from 'react';

import { fetchChatRooms, fetchMessages, postMessage } from '@/lib/api/chat';
import type { ChatSummary, Message, SendMessagePayload } from '@/lib/api/types';
import { loadChatCache, saveChatCache } from '@/lib/storage/chatCache';
import { useApiMutation } from './useApiMutation';
import { useApiQuery, type ApiQueryOptions } from './useApiQuery';


import { loadMessagesCache, saveMessagesCache } from '@/lib/storage/messagesCache';

/**
 * Enhanced messages query with cache support
 * - Loads cached messages immediately on mount
 * - Fetches fresh messages in background
 * - Updates cache when fresh messages arrive
 */
export function useMessagesQuery(chatId: string, options: ApiQueryOptions<Message[]> = {}) {
  const [cachedData, setCachedData] = useState<Message[] | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  // Load cache on mount
  useEffect(() => {
    let isMounted = true;

    const loadCache = async () => {
      const cached = await loadMessagesCache(chatId);
      if (isMounted) {
        setCachedData(cached);
        setIsLoadingCache(false);
      }
    };

    loadCache();

    return () => {
      isMounted = false;
    };
  }, [chatId]);

  const queryFn = useCallback(async () => {
    const freshData = await fetchMessages(chatId);
    
    // Save fresh data to cache for next time
    if (freshData && freshData.length > 0) {
      await saveMessagesCache(chatId, freshData);
    }
    
    return freshData;
  }, [chatId]);

  const result = useApiQuery<Message[]>(['messages', chatId], queryFn, {
    ...options,
    // Use cached data as initial data if available
    initialData: cachedData || undefined,
  });

  return {
    ...result,
    // Override loading state: only show loading if both cache and API are loading
    loading: isLoadingCache || (result.loading && !cachedData),
    // Indicate if data is from cache
    isStale: Boolean(cachedData && result.loading),
  };
}

export function useSendMessageMutation() {
  return useApiMutation<SendMessagePayload, Message>(postMessage);
}

/**
 * Enhanced chat rooms query with cache support
 * - Loads cached data immediately on mount
 * - Fetches fresh data in background
 * - Updates cache when fresh data arrives
 */
export function useChatRoomsQuery(options: ApiQueryOptions<ChatSummary[]> = {}) {
  const [cachedData, setCachedData] = useState<ChatSummary[] | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  // Load cache on mount
  useEffect(() => {
    let isMounted = true;

    const loadCache = async () => {
      const cached = await loadChatCache();
      if (isMounted) {
        setCachedData(cached);
        setIsLoadingCache(false);
      }
    };

    loadCache();

    return () => {
      isMounted = false;
    };
  }, []);

  const queryFn = useCallback(async () => {
    const freshData = await fetchChatRooms();
    
    // Save fresh data to cache for next time
    if (freshData && freshData.length > 0) {
      await saveChatCache(freshData);
    }
    
    return freshData;
  }, []);

  const result = useApiQuery<ChatSummary[]>(['chat-rooms'], queryFn, {
    ...options,
    // Use cached data as initial data if available
    initialData: cachedData || undefined,
  });

  return {
    ...result,
    // Override loading state: only show loading if both cache and API are loading
    loading: isLoadingCache || (result.loading && !cachedData),
    // Indicate if data is from cache
    isStale: Boolean(cachedData && result.loading),
  };
}
