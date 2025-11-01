import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import UserModel from '../models/User';

const expo = new Expo();

type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, any>;
};

/**
 * Send push notification to a user by their userId
 */
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    const user = await UserModel.findById(userId).select('pushTokens').lean();
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      console.log(`No push tokens for user ${userId}`);
      return;
    }

    // Filter valid Expo push tokens
    const validTokens = user.pushTokens.filter((token) => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) {
      console.log(`No valid Expo push tokens for user ${userId}`);
      return;
    }

    // Create messages
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    }));

    // Send in chunks (Expo recommends batching)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    console.log(`Sent ${tickets.length} push notifications to user ${userId}`);
  } catch (error) {
    console.error(`Failed to send push notification to user ${userId}:`, error);
  }
}
