import { useCallback, useEffect, useState } from 'react';

import { acceptFriendRequest, addFriend, getFriendRequests, getFriends, rejectFriendRequest, searchFriends } from '@/lib/api/friends';
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

export function useFriendRequests() {
  const queryFn = useCallback(async () => {
    return await getFriendRequests();
  }, []);

  const result = useApiQuery<any[]>(['friend-requests'], queryFn, {});

  const acceptMutation = useApiMutation<{ requestId: string }, any>(async ({ requestId }) =>
    acceptFriendRequest(requestId)
  );

  const rejectMutation = useApiMutation<{ requestId: string }, any>(async ({ requestId }) =>
    rejectFriendRequest(requestId)
  );

  const accept = async (requestId: string) => {
    // optimistic: immediately refetch after success; caller can optimistically remove from UI
    const res = await acceptMutation.mutate({ requestId });
    await result.refetch();
    return res;
  };

  const reject = async (requestId: string) => {
    const res = await rejectMutation.mutate({ requestId });
    await result.refetch();
    return res;
  };

  return {
    data: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
    accept,
    reject,
    accepting: acceptMutation.loading,
    rejecting: rejectMutation.loading,
  };
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
