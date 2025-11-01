import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  NavigationIndependentTree,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';

import { useNotificationResponseListener, usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from '@/hooks/useSession';
import { useThemePreference } from '@/hooks/useThemePreference';
import { setUnauthorizedListener } from '@/lib/api/client';
import { registerPushToken } from '@/lib/api/pushToken';
import { clearSession } from '@/lib/api/session';
import { darkTheme, lightTheme, navigationDarkTheme, navigationLightTheme, spacing } from '@/theme';
import type {
  AppTabsParamList,
  RootStackParamList
} from '@/types/navigation';
import AddFriendScreen from '../screens/AddFriendScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import FriendsScreen from '../screens/FriendsScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AppTabsParamList>();

function AppTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          marginHorizontal: 60,
          backgroundColor: theme.dark ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.6)',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme.dark ? 0.4 : 0.2,
          shadowRadius: 16,
          height: 68,
          paddingBottom: spacing.md,
          paddingTop: spacing.sm,
          borderRadius: 30,
          borderWidth: 1,
          borderColor: theme.dark ? 'rgba(255, 255, 255, 0.15)' : theme.colors.outlineVariant,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={Platform.OS === 'ios' ? 100 : 120}
            tint={theme.dark ? 'dark' : 'light'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 30,
            }}
          />
        ),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            ChatList: 'chatbubbles',
            Friends: 'people',
            Profile: 'person-circle',
          };

          const iconName = icons[route.name];

          // Haptic feedback on tab press
          if (focused) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          return <Ionicons name={iconName} size={focused ? size + 4 : size + 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Chats' }} />
      <Tab.Screen name="Friends" component={FriendsScreen} options={{ title: 'Friends' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const AppNavigator: React.FC = () => {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useThemePreference();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const session = useSession();
  const { expoPushToken } = usePushNotifications();

  const isDarkMode = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  useEffect(() => {
    setUnauthorizedListener(() => {
      clearSession();
      const current = navigationRef.getCurrentRoute();
      if (current?.name !== 'Login') {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    });

    return () => {
      setUnauthorizedListener(null);
    };
  }, [navigationRef]);

  // Register push token when user is authenticated
  useEffect(() => {
    if (session.token && expoPushToken) {
      registerPushToken(expoPushToken).catch((err: any) => {
        console.warn('Failed to register push token:', err);
      });
    }
  }, [session.token, expoPushToken]);

  // Handle notification responses (when user taps notification)
  useNotificationResponseListener(useCallback((response: any) => {
    const data = response.notification.request.content.data;
    
    // Navigate to appropriate screen based on notification type
    if (data?.chatId && data?.title) {
      navigationRef.navigate('ChatRoom', { chatId: data.chatId, title: data.title });
    } else if (data?.type === 'friend_request') {
      navigationRef.navigate('AppTabs');
    }
  }, [navigationRef]));

  return (
    <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <NavigationIndependentTree>
        <NavigationContainer
          theme={isDarkMode ? navigationDarkTheme : navigationLightTheme}
          ref={navigationRef}
        >
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              animation: 'slide_from_right',
              animationDuration: 250,
            }}
          >
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false, animation: 'fade' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false, animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="AppTabs"
              component={AppTabs}
              options={{ headerShown: false, animation: 'fade' }}
            />
            <Stack.Screen
              name="ChatRoom"
              component={ChatRoomScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="AddFriend"
              component={AddFriendScreen}
              options={{
                title: 'Add Friend',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </PaperProvider>
  );
};

export default AppNavigator;
