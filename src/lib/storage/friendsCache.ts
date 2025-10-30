import type { FriendProfile } from '@/lib/api/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FRIENDS_CACHE_KEY = 'cached_friends';
const CACHE_EXPIRY_KEY = 'friends_cache_expiry';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Save friends list to cache (using AsyncStorage for larger data)
 */
export async function saveFriendsCache(friends: FriendProfile[]): Promise<void> {
  try {
    const cacheData = JSON.stringify(friends);
    const expiryTime = Date.now() + CACHE_DURATION;
    
    await AsyncStorage.setItem(FRIENDS_CACHE_KEY, cacheData);
    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
    
    console.log('[FriendsCache] Saved', friends.length, 'friends to cache');
  } catch (error) {
    console.error('[FriendsCache] Error saving cache:', error);
  }
}

/**
 * Load friends from cache
 * Returns null if cache is expired or invalid
 */
export async function loadFriendsCache(): Promise<FriendProfile[] | null> {
  try {
    const cacheData = await AsyncStorage.getItem(FRIENDS_CACHE_KEY);
    const expiryTimeStr = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (!cacheData || !expiryTimeStr) {
      console.log('[FriendsCache] No cache found');
      return null;
    }
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    const isExpired = Date.now() > expiryTime;
    
    if (isExpired) {
      console.log('[FriendsCache] Cache expired, clearing...');
      await clearFriendsCache();
      return null;
    }
    
    const friends = JSON.parse(cacheData) as FriendProfile[];
    console.log('[FriendsCache] Loaded', friends.length, 'friends from cache');
    
    return friends;
  } catch (error) {
    console.error('[FriendsCache] Error loading cache:', error);
    return null;
  }
}

/**
 * Clear friends cache
 */
export async function clearFriendsCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FRIENDS_CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_EXPIRY_KEY);
    console.log('[FriendsCache] Cache cleared');
  } catch (error) {
    console.error('[FriendsCache] Error clearing cache:', error);
  }
}
