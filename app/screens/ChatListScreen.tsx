import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    Button,
    Divider,
    List,
    Searchbar,
    Surface,
    Text,
    useTheme,
} from 'react-native-paper';

import { useChatRoomsQuery } from '@/hooks/useChatApi';
import { useFriendsList } from '@/hooks/useFriends';
import { useSession } from '@/hooks/useSession';
import type { AppTabsScreenProps, RootStackParamList } from '@/types/navigation';

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

  useFocusEffect(
    useCallback(() => {
      if (token) {
        refetchRooms();
      }

      return undefined;
    }, [refetchRooms, token])
  );

  const getChatTitle = useCallback((chatTitle: string, chatId: string) => {
    // If backend provided a proper title (not chatId), use it
    if (chatTitle && chatTitle !== chatId) {
      return chatTitle;
    }

    // Try to extract friend name from chatId
    if (user && friends) {
      const participantIds = chatId.split('-');
      const friendId = participantIds.find(id => id !== user.id);
      
      if (friendId) {
        const friend = friends.find(f => f.id === friendId);
        if (friend) {
          return friend.name || friend.email;
        }
      }
    }

    // Fallback to chatId
    return chatTitle || chatId;
  }, [user, friends]);

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
            Chats
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {filteredChats.length} conversation{filteredChats.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <Searchbar
        placeholder="Search chats"
        value={query}
        onChangeText={setQuery}
        style={styles.searchBar}
        inputStyle={{ fontSize: 14 }}
      />

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Divider}
        renderItem={({ item }) => {
          const displayTitle = getChatTitle(item.title, item.id);
          
          return (
            <List.Item
              title={displayTitle}
              description={
                item.lastMessage
                  ? `${item.lastMessage.senderName ?? 'Participant'}: ${item.lastMessage.content || 'Attachment'}`
                  : 'No messages yet'
              }
              onPress={() =>
                rootNavigation.navigate('ChatRoom', {
                  chatId: item.id,
                  title: displayTitle,
                })
              }
              left={(props) => (
                <Avatar.Text
                  {...props}
                  label={getInitials(displayTitle)}
                  size={44}
                  style={{ backgroundColor: theme.colors.secondaryContainer }}
                  labelStyle={{ color: theme.colors.onSecondaryContainer }}
                />
              )}
              right={() =>
                item.unreadCount > 0 ? (
                  <Surface style={[styles.unreadPill, { backgroundColor: theme.colors.primary }]}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onPrimary }}>
                      {item.unreadCount}
                    </Text>
                  </Surface>
                ) : null
              }
              style={styles.listItem}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          );
        }}
        ListEmptyComponent={
          <Surface
            style={[styles.emptyState, { borderColor: theme.colors.surfaceVariant }]}
            elevation={0}
          >
            {!token ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Sign in to load your conversations.
              </Text>
            ) : isLoadingRooms ? (
              <ActivityIndicator animating size="small" />
            ) : roomsError ? (
              <View style={styles.emptyStateContent}>
                <Text variant="bodyMedium" style={{ color: theme.colors.error, textAlign: 'center' }}>
                  {roomsError.message}
                </Text>
                <Button mode="text" onPress={refetchRooms}>
                  Retry
                </Button>
              </View>
            ) : (
              <View style={styles.emptyStateContent}>
                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, textAlign: 'center', marginBottom: 8 }}>
                  No conversations yet
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 16 }}>
                  Start chatting with your friends to see conversations here
                </Text>
                <Button 
                  mode="contained" 
                  icon="account-plus"
                  onPress={() => rootNavigation.navigate('AddFriend')}
                >
                  Add Friends
                </Button>
              </View>
            )}
          </Surface>
        }
      />
    </View>
  );
};

export default ChatListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  searchBar: {
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  listItem: {
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  unreadPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    minWidth: 28,
    alignItems: 'center',
  },
  emptyState: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  emptyStateContent: {
    alignItems: 'center',
    gap: 8,
  },
});
