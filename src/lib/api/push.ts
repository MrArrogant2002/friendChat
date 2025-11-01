import { apiRequest } from './client';

export async function registerPushToken(pushToken: string): Promise<void> {
  await apiRequest({
    url: '/users/push-token',
    method: 'POST',
    data: { pushToken },
  });
}
