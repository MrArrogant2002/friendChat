import { useCallback, useEffect, useState } from 'react';

import { addFriend, getFriends, searchFriends } from '@/lib/api/friends';
import type { FriendProfile } from '@/lib/api/types';
import { loadFriendsCache, saveFriendsCache } from '@/lib/storage/friendsCache';
import { useApiMutation } from './useApiMutation';
import { useApiQuery, type ApiQueryOptions } from './useApiQuery';

export function useFriendSearch(query: string, options: ApiQueryOptions<FriendProfile[]> = {}) {
  const trimmedQuery = query.trim();
  const queryFn = useCallback(() => searchFriends(trimmedQuery), [trimmedQuery]);

  return useApiQuery<FriendProfile[]>(['friend-search', trimmedQuery], queryFn, {
    ...options,
    enabled: (options.enabled ?? true) && trimmedQuery.length > 0,
  });
}

export function useAddFriendMutation() {
  return useApiMutation<{ friendId: string }, FriendProfile>(async ({ friendId }) =>
    addFriend(friendId)
  );
}

/**
 * Enhanced friends list query with cache support
 * - Loads cached data immediately on mount
 * - Fetches fresh data in background
 * - Updates cache when fresh data arrives
 */
export function useFriendsList(options: ApiQueryOptions<FriendProfile[]> = {}) {
  const [cachedData, setCachedData] = useState<FriendProfile[] | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  // Load cache on mount
  useEffect(() => {
    let isMounted = true;

    const loadCache = async () => {
      const cached = await loadFriendsCache();
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
    const freshData = await getFriends();
    
    // Save fresh data to cache for next time
    if (freshData && freshData.length > 0) {
      await saveFriendsCache(freshData);
    }
    
    return freshData;
  }, []);

  const result = useApiQuery<FriendProfile[]>(['friends'], queryFn, {
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
