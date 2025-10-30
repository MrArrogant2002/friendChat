import ContactListItem from '@/components/ContactListItem';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    View
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Searchbar,
    Text,
    useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChatRoomsQuery } from '@/hooks/useChatApi';
import { useFriendsList } from '@/hooks/useFriends';
import { useSession } from '@/hooks/useSession';
import { borderRadius, spacing } from '@/theme';
import type { AppTabsParamList, AppTabsScreenProps, RootStackParamList } from '@/types/navigation';

function getInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return 'FC';
  }
  const segments = trimmed.split(' ').filter(Boolean);
  if (segments.length === 1) {
    return segments[0]!.slice(0, 2).toUpperCase();
  }
  return segments
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('');
}

const ChatListScreen: React.FC<AppTabsScreenProps<'ChatList'>> = () => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const { token, user } = useSession();
  const {
    data: chatRooms,
    loading: isLoadingRooms,
    error: roomsError,
    refetch: refetchRooms,
    isStale,
  } = useChatRoomsQuery({ enabled: Boolean(token) });
  const { data: friends } = useFriendsList({ enabled: Boolean(token) });

  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    const segments = user.name.trim().split(' ');
    return segments
      .slice(0, 2)
      .map((s) => s.charAt(0).toUpperCase())
      .join('');
  }, [user?.name]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        refetchRooms();
      }

      return undefined;
    }, [refetchRooms, token])
  );

  const getChatTitle = useCallback(
    (chatTitle: string, chatId: string) => {
      // If backend provided a proper title (not chatId), use it
      if (chatTitle && chatTitle !== chatId) {
        return chatTitle;
      }

      // Try to extract friend name from chatId
      if (user && friends) {
        const participantIds = chatId.split('-');
        const friendId = participantIds.find((id) => id !== user.id);

        if (friendId) {
          const friend = friends.find((f) => f.id === friendId);
          if (friend) {
            return friend.name || friend.email;
          }
        }
      }

      // Fallback to chatId
      return chatTitle || chatId;
    },
    [user, friends]
  );

  const filteredChats = useMemo(() => {
    const rooms = chatRooms ?? [];
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return rooms;
    }
    return rooms.filter((room) => {
      const candidates = [room.title, room.id];
      return candidates.some((candidate) => candidate.toLowerCase().includes(trimmed));
    });
  }, [chatRooms, query]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Instagram-style Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.outline,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.appNameContainer}>
            <Text
              variant="titleLarge"
              style={{
                color: theme.colors.onBackground,
                fontWeight: '700',
                fontSize: 24,
              }}
            >
              FriendlyChat
            </Text>
            {isStale && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ marginLeft: spacing.sm }}
              />
            )}
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search"
          value={query}
          onChangeText={setQuery}
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          ]}
          inputStyle={{
            fontSize: 15,
            color: theme.colors.onBackground,
            minHeight: 0,
            paddingVertical: 0,
          }}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.onSurfaceVariant}
          elevation={0}
          clearIcon="close-circle"
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: any }) => {
          const displayTitle = getChatTitle(item.title, item.id);

          return (
            <ContactListItem
              title={displayTitle}
              subtitle={
                item.lastMessage
                  ? item.lastMessage.content || 'Sent an attachment'
                  : 'Tap to start chatting'
              }
              avatarLabel={getInitials(displayTitle)}
              timestamp={
                item.lastMessage?.createdAt
                  ? new Date(item.lastMessage.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : undefined
              }
              unreadCount={item.unreadCount}
              onPress={() =>
                rootNavigation.navigate('ChatRoom', {
                  chatId: item.id,
                  title: displayTitle,
                })
              }
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            {!token ? (
              <Text
                variant="bodyLarge"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: 'center',
                }}
              >
                Sign in to load your conversations.
              </Text>
            ) : isLoadingRooms ? (
              <ActivityIndicator animating size="large" color={theme.colors.primary} />
            ) : roomsError ? (
              <View style={styles.emptyStateContent}>
                <Text
                  variant="bodyLarge"
                  style={{
                    color: theme.colors.error,
                    textAlign: 'center',
                  }}
                >
                  {roomsError.message}
                </Text>
                <Button
                  mode="contained"
                  onPress={refetchRooms}
                  style={{ marginTop: spacing.md, backgroundColor: theme.colors.primary }}
                >
                  Retry
                </Button>
              </View>
            ) : (
              <View style={styles.emptyStateContent}>
                <Text
                  variant="headlineSmall"
                  style={{
                    color: theme.colors.onSurface,
                    textAlign: 'center',
                    fontWeight: '700',
                  }}
                >
                  No Messages
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textAlign: 'center',
                    marginTop: spacing.sm,
                    marginBottom: spacing.lg,
                  }}
                >
                  Send private messages to a friend
                </Text>
                <Button
                  mode="contained"
                  onPress={() => rootNavigation.navigate('AddFriend')}
                  style={{ backgroundColor: theme.colors.primary, borderRadius: borderRadius.sm }}
                  labelStyle={{ fontSize: 14, fontWeight: '600' }}
                >
                  Send Message
                </Button>
              </View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ChatListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  searchBar: {
    borderRadius: borderRadius.md,
    elevation: 0,
    height: 36,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: 100, // Space for floating tab bar
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
});
