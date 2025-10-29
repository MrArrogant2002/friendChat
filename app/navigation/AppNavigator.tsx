import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  NavigationIndependentTree,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';

import { useThemePreference } from '@/hooks/useThemePreference';
import { setUnauthorizedListener } from '@/lib/api/client';
import { clearSession } from '@/lib/api/session';
import { darkTheme, lightTheme, navigationDarkTheme, navigationLightTheme, spacing } from '@/theme';
import type {
  AppTabsParamList,
  RootStackParamList,
  RootStackScreenProps,
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
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 64,
          paddingBottom: spacing.sm,
          paddingTop: spacing.sm,
        },
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
              options={({ route }: RootStackScreenProps<'ChatRoom'>) => ({
                title: route.params.title,
                animation: 'slide_from_right',
              })}
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
