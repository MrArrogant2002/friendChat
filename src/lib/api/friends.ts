import { apiRequest } from './client';
import type { ApiListResponse, FriendProfile } from './types';

type FriendSearchResponse = ApiListResponse<FriendProfile, 'results'>;
type FriendListResponse = ApiListResponse<FriendProfile, 'friends'>;

type AddFriendResponse = {
  friend: FriendProfile;
};

export async function getFriends(): Promise<FriendProfile[]> {
  const response = await apiRequest<FriendListResponse>({
    url: '/friends',
    method: 'GET',
  });

  return response.friends;
}

export async function searchFriends(query: string): Promise<FriendProfile[]> {
  if (!query.trim()) {
    return [];
  }

  const response = await apiRequest<FriendSearchResponse>({
    url: `/friends/search?query=${encodeURIComponent(query.trim())}`,
    method: 'GET',
  });

  return response.results;
}

export async function addFriend(friendId: string): Promise<FriendProfile> {
  const response = await apiRequest<AddFriendResponse>({
    url: '/friends/add',
    method: 'POST',
    data: { friendId },
  });

  return response.friend;
}
