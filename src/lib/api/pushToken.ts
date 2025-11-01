import { apiRequest } from './client';

/**
 * Register push token for the authenticated user
 */
export async function registerPushToken(pushToken: string): Promise<void> {
  await apiRequest({
    url: '/users/push-token',
    method: 'POST',
    data: { pushToken },
  });
}
