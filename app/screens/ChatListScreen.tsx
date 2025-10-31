import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MotiView } from 'moti';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Image as RNImage, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Searchbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChatRoomsQuery } from '@/hooks/useChatApi';
import { useFriendsList } from '@/hooks/useFriends';
import { useSession } from '@/hooks/useSession';
import { borderRadius, shadows, spacing } from '@/theme';
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
      {/* Modern header */}
      <Surface elevation={1} style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <RNImage
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text
            variant="titleLarge"
            style={{
              color: theme.colors.onSurface,
              fontWeight: '600',
              marginLeft: spacing.sm,
            }}
          >
            FriendlyChart
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => tabNavigation.navigate('Profile')}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Avatar.Text
              size={40}
              label={userInitials}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              labelStyle={{
                color: theme.colors.onPrimaryContainer,
                fontWeight: '600',
              }}
            />
          </Pressable>
        </View>
      </Surface>
      <Searchbar
        placeholder="Search chats"
        value={query}
        onChangeText={setQuery}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        inputStyle={{ fontSize: 14 }}
        iconColor={theme.colors.primary}
        elevation={0}
      />{' '}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item, index }) => {
          const displayTitle = getChatTitle(item.title, item.id);

          return (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 300,
                delay: index * 50,
              }}
            >
              <Pressable
                onPress={() =>
                  rootNavigation.navigate('ChatRoom', {
                    chatId: item.id,
                    title: displayTitle,
                  })
                }
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Surface
                  elevation={0}
                  style={[
                    styles.chatItem,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <Avatar.Text
                    label={getInitials(displayTitle)}
                    size={48}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    labelStyle={{
                      color: theme.colors.onPrimaryContainer,
                      fontWeight: '600',
                    }}
                  />
                  <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                      <Text
                        variant="titleMedium"
                        style={{
                          color: theme.colors.onSurface,
                          fontWeight: '600',
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {displayTitle}
                      </Text>
                      {item.unreadCount > 0 && (
                        <Surface
                          style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}
                          elevation={1}
                        >
                          <Text
                            variant="labelSmall"
                            style={{
                              color: theme.colors.surface,
                              fontWeight: '600',
                            }}
                          >
                            {item.unreadCount > 99 ? '99+' : item.unreadCount}
                          </Text>
                        </Surface>
                      )}
                    </View>
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        marginTop: spacing.xs,
                      }}
                      numberOfLines={2}
                    >
                      {item.lastMessage
                        ? `${item.lastMessage.senderName ?? 'Participant'}: ${item.lastMessage.content || 'Attachment'}`
                        : 'No messages yet'}
                    </Text>
                  </View>
                </Surface>
              </Pressable>
            </MotiView>
          );
        }}
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <Surface
              style={[
                styles.emptyState,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              elevation={0}
            >
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
                  <Button mode="contained" onPress={refetchRooms} style={{ marginTop: spacing.md }}>
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
                      fontWeight: '600',
                    }}
                  >
                    No conversations yet
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      textAlign: 'center',
                      marginTop: spacing.sm,
                    }}
                  >
                    Start chatting with your friends
                  </Text>
                  <Button
                    mode="contained"
                    icon="account-plus"
                    onPress={() => rootNavigation.navigate('AddFriend')}
                    style={{ marginTop: spacing.lg }}
                    contentStyle={{ paddingVertical: spacing.xs }}
                  >
                    Add Friends
                  </Button>
                </View>
              )}
            </Surface>
          </MotiView>
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
  logo: {
    width: 36,
    height: 36,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBar: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    borderWidth: 1,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  emptyStateContent: {
    alignItems: 'center',
  },
});
