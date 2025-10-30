import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    HelperText,
    IconButton,
    List,
    Searchbar,
    Snackbar,
    Surface,
    Text,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChatRoomsQuery } from '@/hooks/useChatApi';
import { useAddFriendMutation, useFriendSearch } from '@/hooks/useFriends';
import { useSession } from '@/hooks/useSession';
import type { FriendProfile } from '@/lib/api/types';
import { borderRadius, shadows, spacing } from '@/theme';
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
  const {
    data: results,
    loading: isSearching,
    error: searchError,
    refetch: refetchSearch,
  } = useFriendSearch(debouncedQuery, {
    enabled: Boolean(token) && debouncedQuery.trim().length > 0,
  });
  const {
    mutate: addFriend,
    error: addError,
    reset: resetAddError,
  } = useAddFriendMutation();
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

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Optimistic update: immediately show as adding
      setOptimisticAdding((prev) => new Set(prev).add(profile.id));

      try {
        resetAddError();
        await addFriend({ friendId: profile.id });
        await refetchChatRooms();
        setAddedFriendId(profile.id);
        setSnackbarMessage(`✓ Added ${profile.name || profile.email}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Rollback optimistic update on error
        setOptimisticAdding((prev) => {
          const next = new Set(prev);
          next.delete(profile.id);
          return next;
        });
        setSnackbarMessage(`Failed to add ${profile.name || profile.email}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [addFriend, refetchChatRooms, resetAddError, token]
  );

  const handleChatNow = useCallback(
    async (friendId: string, friendName: string) => {
      if (!user) {
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
    ({ item, index }: { item: FriendProfile; index: number }) => {
      const isAdded = addedFriendId === item.id;
      const isOptimisticallyAdding = optimisticAdding.has(item.id);

      return (
        <View>
          <List.Item
            title={item.name || item.email}
            description={item.email}
            left={(props: any) => (
              <Avatar.Text
                {...props}
                label={(item.name || item.email).slice(0, 2).toUpperCase()}
                size={44}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                labelStyle={{ color: theme.colors.onPrimaryContainer }}
              />
            )}
            right={() => (
              <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                {isAdded ? (
                  <Pressable
                    onPress={() => handleChatNow(item.id, item.name || item.email)}
                    style={({ pressed }) => [
                      styles.actionButton,
                      {
                        backgroundColor: theme.colors.primary,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <IconButton
                      icon="chat"
                      size={18}
                      iconColor={theme.colors.surface}
                      style={{ margin: 0 }}
                    />
                    <Text
                      variant="labelMedium"
                      style={{
                        color: theme.colors.surface,
                        fontWeight: '600',
                      }}
                    >
                      Chat
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handleAddFriend(item)}
                    disabled={isOptimisticallyAdding}
                    style={({ pressed }) => [
                      styles.actionButton,
                      {
                        backgroundColor: theme.colors.primaryContainer,
                        opacity: pressed ? 0.8 : isOptimisticallyAdding ? 0.6 : 1,
                      },
                    ]}
                  >
                    {isOptimisticallyAdding ? (
                      <ActivityIndicator size="small" color={theme.colors.onPrimaryContainer} />
                    ) : (
                      <IconButton
                        icon="account-plus"
                        size={18}
                        iconColor={theme.colors.onPrimaryContainer}
                        style={{ margin: 0 }}
                      />
                    )}
                    <Text
                      variant="labelMedium"
                      style={{
                        color: theme.colors.onPrimaryContainer,
                        fontWeight: '600',
                      }}
                    >
                      {isOptimisticallyAdding ? 'Adding...' : 'Add'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
        </View>
      );
    },
    [addedFriendId, optimisticAdding, handleAddFriend, handleChatNow, theme.colors]
  );

  const listEmptyComponent = useMemo(() => {
    if (!token) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
          >
            Sign in to search for friends
          </Text>
        </Surface>
      );
    }

    if (trimmedQuery.length === 0) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <IconButton
            icon="account-search"
            size={48}
            iconColor={theme.colors.onSurfaceVariant}
            style={{ opacity: 0.6 }}
          />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
          >
            Start typing to search for friends
          </Text>
        </Surface>
      );
    }

    if (isSearching) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <ActivityIndicator animating size="large" color={theme.colors.primary} />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.md }}
          >
            Searching...
          </Text>
        </Surface>
      );
    }

    if (searchError) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <IconButton
            icon="alert-circle"
            size={48}
            iconColor={theme.colors.error}
            style={{ opacity: 0.6 }}
          />
          <HelperText type="error" visible>
            {searchError.message}
          </HelperText>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              refetchSearch();
            }}
            style={({ pressed }) => [
              styles.retryButton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.onSurface,
                fontWeight: '500',
              }}
            >
              Retry
            </Text>
          </Pressable>
        </Surface>
      );
    }

    return (
      <Surface elevation={0} style={styles.emptyState}>
        <IconButton
          icon="account-off"
          size={48}
          iconColor={theme.colors.onSurfaceVariant}
          style={{ opacity: 0.6 }}
        />
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
        >
          No users found
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', opacity: 0.7 }}
        >
          Try a different search term
        </Text>
      </Surface>
    );
  }, [isSearching, refetchSearch, searchError, theme.colors, token, trimmedQuery.length]);

  useEffect(() => {
    if (addError) {
      setSnackbarMessage(addError.message);
    }
  }, [addError]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View>
        <View style={styles.headerRow}>
          <View>
            <Text
              variant="headlineMedium"
              style={{ color: theme.colors.onBackground, fontWeight: '700' }}
            >
              Add Friend
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }}
            >
              Search by name or email
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <IconButton
              icon="close"
              size={20}
              iconColor={theme.colors.onSurface}
              style={{ margin: 0 }}
            />
          </Pressable>
        </View>
      </View>

      <View>
        <Searchbar
          placeholder="Search users..."
          value={query}
          onChangeText={setQuery}
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: borderRadius.lg,
            },
            shadows.sm,
          ]}
          inputStyle={{ fontSize: 15 }}
          autoFocus
          elevation={0}
        />
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item: FriendProfile) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={listEmptyComponent}
        showsVerticalScrollIndicator={false}
      />

      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
        style={{ backgroundColor: theme.colors.inverseSurface }}
      >
        <Text style={{ color: theme.colors.inverseOnSurface }}>{snackbarMessage}</Text>
      </Snackbar>
    </SafeAreaView>
  );
};

export default AddFriendScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  closeButton: {
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  searchBar: {
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  listItem: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  emptyState: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
