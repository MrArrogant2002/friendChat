import type { ChatSummary } from '@/lib/api/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_CACHE_KEY = 'cached_chat_rooms';
const CACHE_EXPIRY_KEY = 'chat_cache_expiry';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Save chat rooms to cache (using AsyncStorage for larger data)
 */
export async function saveChatCache(chatRooms: ChatSummary[]): Promise<void> {
  try {
    const cacheData = JSON.stringify(chatRooms);
    const expiryTime = Date.now() + CACHE_DURATION;
    
    await AsyncStorage.setItem(CHAT_CACHE_KEY, cacheData);
    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
    
    console.log('[ChatCache] Saved', chatRooms.length, 'chat rooms to cache');
  } catch (error) {
    console.error('[ChatCache] Error saving cache:', error);
  }
}

/**
 * Load chat rooms from cache
 * Returns null if cache is expired or invalid
 */
export async function loadChatCache(): Promise<ChatSummary[] | null> {
  try {
    const cacheData = await AsyncStorage.getItem(CHAT_CACHE_KEY);
    const expiryTimeStr = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (!cacheData || !expiryTimeStr) {
      console.log('[ChatCache] No cache found');
      return null;
    }
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    const isExpired = Date.now() > expiryTime;
    
    if (isExpired) {
      console.log('[ChatCache] Cache expired, clearing...');
      await clearChatCache();
      return null;
    }
    
    const chatRooms = JSON.parse(cacheData) as ChatSummary[];
    console.log('[ChatCache] Loaded', chatRooms.length, 'chat rooms from cache');
    
    return chatRooms;
  } catch (error) {
    console.error('[ChatCache] Error loading cache:', error);
    return null;
  }
}

/**
 * Clear chat cache
 */
export async function clearChatCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAT_CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_EXPIRY_KEY);
    console.log('[ChatCache] Cache cleared');
  } catch (error) {
    console.error('[ChatCache] Error clearing cache:', error);
  }
}

/**
 * Check if cache exists and is valid
 */
export async function hasChatCache(): Promise<boolean> {
  try {
    const cacheData = await AsyncStorage.getItem(CHAT_CACHE_KEY);
    const expiryTimeStr = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (!cacheData || !expiryTimeStr) {
      return false;
    }
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    return Date.now() < expiryTime;
  } catch (error) {
    return false;
  }
}
