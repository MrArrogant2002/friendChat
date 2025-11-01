import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Hook to register for push notifications and get the Expo push token
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        setExpoPushToken(token ?? null);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  return { expoPushToken, error };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (isExpoGo && Platform.OS === 'android') {
    console.log('Push notifications are not supported in Expo Go on Android. Please use a development build.');
    return undefined;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return;
  }

  // Get the projectId from app.json/app.config.js
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('Project ID not found. Push notifications may not work.');
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    // Don't throw in Expo Go, just log
    if (isExpoGo) {
      console.log('Push notifications require a development build. Continuing without push support.');
      return undefined;
    }
    throw error;
  }
}

/**
 * Hook to listen for notification taps
 */
export function useNotificationResponseListener(
  callback: (notification: Notifications.Notification) => void
) {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      callback(response.notification);
    });

    return () => subscription.remove();
  }, [callback]);
}
