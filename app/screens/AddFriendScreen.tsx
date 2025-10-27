import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Divider,
  HelperText,
  List,
  Searchbar,
  Snackbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

import { useChatRoomsQuery } from '@/hooks/useChatApi';
import { useAddFriendMutation, useFriendSearch } from '@/hooks/useFriends';
import { useSession } from '@/hooks/useSession';
import type { FriendProfile } from '@/lib/api/types';
import type { RootStackScreenProps } from '@/types/navigation';

const DEBOUNCE_MS = 300;

const AddFriendScreen: React.FC<RootStackScreenProps<'AddFriend'>> = ({ navigation }) => {
  const theme = useTheme();
  const { token, user } = useSession();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [addedFriendId, setAddedFriendId] = useState<string | null>(null);
  const [optimisticAdding, setOptimisticAdding] = useState<Set<string>>(new Set());
  const { data: results, loading: isSearching, error: searchError, refetch: refetchSearch } = useFriendSearch(
    debouncedQuery,
    {
      enabled: Boolean(token) && debouncedQuery.trim().length > 0,
    }
  );
  const { mutate: addFriend, loading: isAdding, error: addError, reset: resetAddError } = useAddFriendMutation();
  const { refetch: refetchChatRooms } = useChatRoomsQuery({ enabled: false });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      setSnackbarMessage(null);
      setAddedFriendId(null);
      return undefined;
    }, [])
  );

  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const searchResults = results ?? [];

  const handleAddFriend = useCallback(
    async (profile: FriendProfile) => {
      if (!token) {
        return;
      }

      // Optimistic update: immediately show as adding
      setOptimisticAdding((prev) => new Set(prev).add(profile.id));

      try {
        resetAddError();
        await addFriend({ friendId: profile.id });
        await refetchChatRooms();
        setAddedFriendId(profile.id);
        setSnackbarMessage(`✓ Added ${profile.name || profile.email}`);
      } catch (error) {
        // Rollback optimistic update on error
        setOptimisticAdding((prev) => {
          const next = new Set(prev);
          next.delete(profile.id);
          return next;
        });
        setSnackbarMessage(`Failed to add ${profile.name || profile.email}`);
      }
    },
    [addFriend, refetchChatRooms, resetAddError, token]
  );

  const handleChatNow = useCallback(
    async (friendId: string, friendName: string) => {
      if (!user) {
        return;
      }
      
      // Create a deterministic chat ID by sorting user IDs
      const chatId = [user.id, friendId].sort().join('-');
      
      // Navigate to chat room
      navigation.navigate('ChatRoom', {
        chatId,
        title: friendName,
      });
    },
    [navigation, user]
  );

  const renderItem = useCallback(
    ({ item }: { item: FriendProfile }) => {
      const isAdded = addedFriendId === item.id;
      const isOptimisticallyAdding = optimisticAdding.has(item.id);
      
      return (
        <List.Item
          title={item.name || item.email}
          description={item.email}
          left={(props) => (
            <Avatar.Text
              {...props}
              label={(item.name || item.email).slice(0, 2).toUpperCase()}
              size={44}
              style={{ backgroundColor: theme.colors.secondaryContainer }}
              labelStyle={{ color: theme.colors.onSecondaryContainer }}
            />
          )}
          right={() => (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {isAdded ? (
                <Button
                  mode="contained"
                  onPress={() => handleChatNow(item.id, item.name || item.email)}
                  icon="chat"
                >
                  Chat Now
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={() => handleAddFriend(item)}
                  loading={isOptimisticallyAdding}
                  disabled={isOptimisticallyAdding}
                  icon={isOptimisticallyAdding ? undefined : "account-plus"}
                >
                  {isOptimisticallyAdding ? 'Adding...' : 'Add'}
                </Button>
              )}
            </View>
          )}
          style={styles.listItem}
          titleStyle={{ color: theme.colors.onSurface }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        />
      );
    },
    [addedFriendId, optimisticAdding, handleAddFriend, handleChatNow, isAdding, theme.colors.onSecondaryContainer, theme.colors.onSurface, theme.colors.onSurfaceVariant, theme.colors.secondaryContainer]
  );

  const listEmptyComponent = useMemo(() => {
    if (!token) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Sign in to search for friends.
          </Text>
        </Surface>
      );
    }

    if (trimmedQuery.length === 0) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Start typing to search for friends by name or email.
          </Text>
        </Surface>
      );
    }

    if (isSearching) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <ActivityIndicator animating size="small" />
        </Surface>
      );
    }

    if (searchError) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <HelperText type="error" visible>
            {searchError.message}
          </HelperText>
          <Button mode="text" onPress={refetchSearch}>
            Retry
          </Button>
        </Surface>
      );
    }

    return (
      <Surface elevation={0} style={styles.emptyState}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          No users found. Try a different search term.
        </Text>
      </Surface>
    );
  }, [isSearching, refetchSearch, searchError, theme.colors.onSurfaceVariant, token, trimmedQuery.length]);

  useEffect(() => {
    if (addError) {
      setSnackbarMessage(addError.message);
    }
  }, [addError]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
          Add Friend
        </Text>
        <Button onPress={() => navigation.goBack()} mode="text">
          Close
        </Button>
      </View>

      <Searchbar
        placeholder="Search by name or email"
        value={query}
        onChangeText={setQuery}
        style={styles.searchBar}
        inputStyle={{ fontSize: 14 }}
        autoFocus
      />

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={listEmptyComponent}
      />

      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

export default AddFriendScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  searchBar: {
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 32,
  },
  listItem: {
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  emptyState: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
  },
});
