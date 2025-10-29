import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AppTabs: undefined;
  ChatRoom: {
    chatId: string;
    title: string;
  };
  AddFriend: undefined;
};

export type AppTabsParamList = {
  ChatList: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type AuthStackScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;

export type RootStackScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;

export type AppTabsScreenProps<RouteName extends keyof AppTabsParamList> = BottomTabScreenProps<
  AppTabsParamList,
  RouteName
>;
