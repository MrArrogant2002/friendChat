import { useCallback } from 'react';

import { getProfile, login, register } from '@/lib/api/auth';
import { clearSession, setSession } from '@/lib/api/session';
import type { ApiUser, AuthResponse, LoginPayload, RegisterPayload } from '@/lib/api/types';
import { useApiMutation } from './useApiMutation';
import { useApiQuery, type ApiQueryOptions } from './useApiQuery';
import { useSession } from './useSession';

export function useLoginMutation() {
  return useApiMutation<LoginPayload, AuthResponse>(login, {
    onSuccess: async (response) => {
      setSession(response);
    },
  });
}

export function useRegisterMutation() {
  return useApiMutation<RegisterPayload, AuthResponse>(register, {
    onSuccess: async (response) => {
      setSession(response);
    },
  });
}

export function useProfileQuery(options: ApiQueryOptions<ApiUser> = {}) {
  const { token } = useSession();
  const enabled = (options.enabled ?? true) && Boolean(token);

  const queryFn = useCallback(async () => {
    const response = await getProfile();
    return response.user;
  }, []);

  return useApiQuery<ApiUser>(['profile', token], queryFn, {
    ...options,
    enabled,
  });
}

export function useLogoutCallback(): () => void {
  return useCallback(() => {
    clearSession();
  }, []);
}
