import type { Message } from '@/lib/api/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MESSAGES_CACHE_PREFIX = 'cached_messages_';
const CACHE_EXPIRY_PREFIX = 'messages_cache_expiry_';
const CACHE_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days (shorter for messages)

/**
 * Save messages for a specific chat to cache (using AsyncStorage for larger data)
 */
export async function saveMessagesCache(chatId: string, messages: Message[]): Promise<void> {
  try {
    const cacheKey = `${MESSAGES_CACHE_PREFIX}${chatId}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}${chatId}`;
    const cacheData = JSON.stringify(messages);
    const expiryTime = Date.now() + CACHE_DURATION;
    
    await AsyncStorage.setItem(cacheKey, cacheData);
    await AsyncStorage.setItem(expiryKey, expiryTime.toString());
    
    console.log('[MessagesCache] Saved', messages.length, 'messages for chat', chatId);
  } catch (error) {
    console.error('[MessagesCache] Error saving cache:', error);
  }
}

/**
 * Load messages for a specific chat from cache
 * Returns null if cache is expired or invalid
 */
export async function loadMessagesCache(chatId: string): Promise<Message[] | null> {
  try {
    const cacheKey = `${MESSAGES_CACHE_PREFIX}${chatId}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}${chatId}`;
    const cacheData = await AsyncStorage.getItem(cacheKey);
    const expiryTimeStr = await AsyncStorage.getItem(expiryKey);
    
    if (!cacheData || !expiryTimeStr) {
      console.log('[MessagesCache] No cache found for chat', chatId);
      return null;
    }
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    const isExpired = Date.now() > expiryTime;
    
    if (isExpired) {
      console.log('[MessagesCache] Cache expired for chat', chatId);
      await clearMessagesCache(chatId);
      return null;
    }
    
    const messages = JSON.parse(cacheData) as Message[];
    console.log('[MessagesCache] Loaded', messages.length, 'messages for chat', chatId);
    
    return messages;
  } catch (error) {
    console.error('[MessagesCache] Error loading cache:', error);
    return null;
  }
}

/**
 * Clear messages cache for a specific chat
 */
export async function clearMessagesCache(chatId: string): Promise<void> {
  try {
    const cacheKey = `${MESSAGES_CACHE_PREFIX}${chatId}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}${chatId}`;
    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(expiryKey);
    console.log('[MessagesCache] Cache cleared for chat', chatId);
  } catch (error) {
    console.error('[MessagesCache] Error clearing cache:', error);
  }
}

/**
 * Clear all messages caches (called on logout)
 */
export async function clearAllMessagesCache(): Promise<void> {
  try {
    // Get all keys and clear message-related caches
    const allKeys = await AsyncStorage.getAllKeys();
    const messageCacheKeys = allKeys.filter(key => 
      key.startsWith(MESSAGES_CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_PREFIX)
    );
    
    if (messageCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(messageCacheKeys);
      console.log('[MessagesCache] Cleared', messageCacheKeys.length, 'message cache keys');
    }
  } catch (error) {
    console.error('[MessagesCache] Error clearing all caches:', error);
  }
}
