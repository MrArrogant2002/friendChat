import { useCallback } from 'react';

import { addFriend, getFriends, searchFriends } from '@/lib/api/friends';
import type { FriendProfile } from '@/lib/api/types';
import { useApiMutation } from './useApiMutation';
import { useApiQuery, type ApiQueryOptions } from './useApiQuery';

export function useFriendSearch(query: string, options: ApiQueryOptions = {}) {
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

export function useFriendsList(options: ApiQueryOptions = {}) {
  const queryFn = useCallback(() => getFriends(), []);

  return useApiQuery<FriendProfile[]>(['friends'], queryFn, options);
}
