import { getSocket } from '@/lib/socket/client';
import { useEffect, useState } from 'react';

/**
 * Hook to track online/offline status of users via socket events
 * Returns a Set of currently online user IDs
 */
export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);

    return () => {
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
    };
  }, []);

  return onlineUsers;
}
