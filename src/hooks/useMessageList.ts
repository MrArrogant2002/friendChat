import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlatList } from 'react-native';

import type { Message } from '@/lib/api/types';

export interface UseMessageListOptions {
  initialMessages?: Message[];
  autoScrollOnNew?: boolean;
  autoScrollDelay?: number;
}

export interface UseMessageListReturn {
  messages: Message[];
  upsertMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  clearMessages: () => void;
  scrollToBottom: (animated?: boolean) => void;
  isNearBottom: boolean;
  listRef: React.RefObject<FlatList>;
}

/**
 * Custom hook to manage chat message list with automatic scrolling and updates.
 * 
 * Features:
 * - Maintains chronological order (oldest → newest)
 * - Smart auto-scroll (only when user is at bottom)
 * - Upsert pattern (insert or update)
 * - Smooth scroll handling
 * - Initial load detection
 * 
 * @example
 * const { messages, upsertMessage, scrollToBottom, listRef } = useMessageList({
 *   initialMessages: remoteMessages,
 *   autoScrollOnNew: true,
 * });
 */
export function useMessageList(options: UseMessageListOptions = {}): UseMessageListReturn {
  const {
    initialMessages = [],
    autoScrollOnNew = true,
    autoScrollDelay = 100,
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<FlatList>(null);
  const isNearBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);

  // Track if user is near bottom of the list
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Sort messages chronologically (oldest first, newest last)
  const sortMessages = useCallback((msgs: Message[]): Message[] => {
    return [...msgs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, []);

  // Initialize messages from props
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(sortMessages(initialMessages));
      isInitialLoadRef.current = true;
    }
  }, [initialMessages, sortMessages]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length === 0) return;
    if (!autoScrollOnNew) return;

    const scrollToEnd = (animated: boolean) => {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated });
      }, autoScrollDelay);
    };

    // Initial load: scroll without animation
    if (isInitialLoadRef.current) {
      scrollToEnd(false);
      isInitialLoadRef.current = false;
      return;
    }

    // New messages: only scroll if user is near bottom
    if (isNearBottomRef.current) {
      scrollToEnd(true);
    }
  }, [messages, autoScrollOnNew, autoScrollDelay]);

  // Sync ref with state for external access
  useEffect(() => {
    setIsNearBottom(isNearBottomRef.current);
  }, [messages]);

  /**
   * Insert new message or update existing one
   */
  const upsertMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === message.id);
        
        if (index >= 0) {
          // Update existing message
          const updated = [...prev];
          updated[index] = message;
          return sortMessages(updated);
        }
        
        // Insert new message
        return sortMessages([...prev, message]);
      });
    },
    [sortMessages]
  );

  /**
   * Update specific fields of a message
   */
  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      );
    },
    []
  );

  /**
   * Remove a message by ID
   */
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    isInitialLoadRef.current = true;
  }, []);

  /**
   * Manually scroll to bottom
   */
  const scrollToBottom = useCallback(
    (animated: boolean = true) => {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated });
      }, autoScrollDelay);
      isNearBottomRef.current = true; // Reset tracking
      setIsNearBottom(true);
    },
    [autoScrollDelay]
  );

  /**
   * Internal method to update scroll tracking (use with FlatList onScroll)
   */
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    const distanceFromBottom = contentHeight - offsetY - layoutHeight;
    const nearBottom = distanceFromBottom < 100;
    
    isNearBottomRef.current = nearBottom;
    setIsNearBottom(nearBottom);
  }, []);

  return {
    messages,
    upsertMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    scrollToBottom,
    isNearBottom,
    listRef,
    // Internal - expose for FlatList onScroll
    _handleScroll: handleScroll,
  } as UseMessageListReturn & { _handleScroll: (event: any) => void };
}
