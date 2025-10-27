import { useEffect, useState } from 'react';

import { getSession, subscribe } from '@/lib/api/session';
import type { ApiUser } from '@/lib/api/types';

type SessionState = {
  token: string | null;
  user: ApiUser | null;
};

export function useSession(): SessionState {
  const [session, setSession] = useState<SessionState>(() => getSession());

  useEffect(() => {
    const unsubscribe = subscribe(setSession);
    return () => unsubscribe();
  }, []);

  return session;
}
