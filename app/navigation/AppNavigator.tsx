import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, NavigationIndependentTree, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';

import { useThemePreference } from '@/hooks/useThemePreference';
import { setUnauthorizedListener } from '@/lib/api/client';
import { clearSession } from '@/lib/api/session';
import { darkTheme, lightTheme, navigationDarkTheme, navigationLightTheme } from '@/theme';
import type { AppTabsParamList, RootStackParamList, RootStackScreenProps } from '@/types/navigation';
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
          borderTopColor: theme.colors.surfaceVariant,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            ChatList: 'chatbubbles-outline',
            Friends: 'people-outline',
            Profile: 'person-circle-outline',
          };

          const iconName = icons[route.name];
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Chats' }} />
      <Tab.Screen name="Friends" component={FriendsScreen} options={{ title: 'My Friends' }} />
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
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="AppTabs"
              component={AppTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChatRoom"
              component={ChatRoomScreen}
              options={({ route }: RootStackScreenProps<'ChatRoom'>) => ({
                title: route.params.title,
              })}
            />
            <Stack.Screen
              name="AddFriend"
              component={AddFriendScreen}
              options={{ title: 'Add Friend' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </PaperProvider>
  );
};

export default AppNavigator;
