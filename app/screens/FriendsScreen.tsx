import type { NavigationProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  FAB,
  HelperText,
  IconButton,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import ContactListItem from '@/components/ContactListItem';
import { useAddFriendMutation, useFriendRequests, useFriendSearch, useFriendsList } from '@/hooks/useFriends';
import { useSession } from '@/hooks/useSession';
import type { FriendProfile } from '@/lib/api/types';
import { borderRadius, spacing } from '@/theme';
import type { AppTabsScreenProps, RootStackParamList } from '@/types/navigation';

const FriendsScreen: React.FC<AppTabsScreenProps<'Friends'>> = ({ navigation }) => {
  const theme = useTheme();
  const { token, user } = useSession();
  const { data: friends, loading, error, refetch, isStale } = useFriendsList({ enabled: Boolean(token) });

  // UI state for tabs and search
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  // Debounce the search input to be responsive
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const { data: searchResults, loading: searching } = useFriendSearch(debouncedQuery);
  const addFriendMutation = useAddFriendMutation();

  // Friend requests (hook handles fetching + accept/reject)
  const friendRequestsHook = useFriendRequests();
  const pendingRequests = friendRequestsHook.data ?? [];
  const pendingCount = pendingRequests.length;

  // Local copy for optimistic updates
  const [localRequests, setLocalRequests] = useState<any[] | null>(null);

  useEffect(() => {
    setLocalRequests(pendingRequests ? [...pendingRequests] : []);
  }, [pendingRequests]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        refetch();
      }

      return undefined;
    }, [refetch, token])
  );

  const friendList = friends ?? [];

  const handleAddFriend = useCallback(() => {
    const parentNavigation = navigation.getParent<NavigationProp<RootStackParamList>>();
    parentNavigation?.navigate('AddFriend');
  }, [navigation]);

  const handleChatNow = useCallback(
    (friendId: string, friendName: string) => {
      if (!user) {
        return;
      }

      // Create a deterministic chat ID by sorting user IDs
      const chatId = [user.id, friendId].sort().join('-');

      const parentNavigation = navigation.getParent<NavigationProp<RootStackParamList>>();
      parentNavigation?.navigate('ChatRoom', {
        chatId,
        title: friendName,
      });
    },
    [navigation, user]
  );

  const renderItem = useCallback(
    ({ item }: { item: FriendProfile }) => (
      <ContactListItem
        title={item.name || item.email}
        subtitle={item.email}
        avatarLabel={(item.name || item.email).slice(0, 2).toUpperCase()}
        onPress={() => handleChatNow(item.id, item.name || item.email)}
        isOnline={Boolean((item as any).isOnline)}
      />
    ),
    [handleChatNow]
  );

  const listEmptyComponent = useMemo(() => {
    if (!token) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text
            variant="bodyLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center',
            }}
          >
            Sign in to view your friends.
          </Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator animating size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyStateContainer}>
          <HelperText type="error" visible>
            {error.message}
          </HelperText>
          <Button
            mode="contained"
            onPress={refetch}
            style={{ marginTop: spacing.md, backgroundColor: theme.colors.primary }}
          >
            Retry
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateContainer}>
        <Text
          variant="headlineSmall"
          style={{
            color: theme.colors.onSurface,
            textAlign: 'center',
            fontWeight: '700',
          }}
        >
          No Friends Yet
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
          Add friends to start chatting
        </Text>
        <Button
          mode="contained"
          onPress={handleAddFriend}
          style={{ backgroundColor: theme.colors.primary, borderRadius: borderRadius.sm }}
          labelStyle={{ fontSize: 14, fontWeight: '600' }}
        >
          Add Friends
        </Button>
      </View>
    );
  }, [error, handleAddFriend, loading, refetch, theme.colors, token]);

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
        {/* Add Friend icon in header (top-right) */}
        <IconButton icon="account-plus" onPress={() => setActiveTab('search')} size={26} />
      </View>

      {/* Top tab bar (Friends / Requests / Search) */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.outline }]}>
        <Pressable onPress={() => setActiveTab('friends')} style={({ pressed }) => [styles.tabItem, activeTab === 'friends' && styles.tabItemActive, { opacity: pressed ? 0.8 : 1 }] }>
          <Text variant="titleSmall" style={{ color: activeTab === 'friends' ? theme.colors.primary : theme.colors.onBackground, fontWeight: '700' }}>Friends</Text>
        </Pressable>

        <Pressable onPress={() => setActiveTab('requests')} style={({ pressed }) => [styles.tabItem, activeTab === 'requests' && styles.tabItemActive, { opacity: pressed ? 0.8 : 1 }] }>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="titleSmall" style={{ color: activeTab === 'requests' ? theme.colors.primary : theme.colors.onBackground, fontWeight: '700' }}>Requests</Text>
            {pendingCount > 0 ? (
              <View style={styles.requestsBadge}>
                <Text variant="labelSmall" style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{pendingCount}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        <Pressable onPress={() => setActiveTab('search')} style={({ pressed }) => [styles.tabItem, activeTab === 'search' && styles.tabItemActive, { opacity: pressed ? 0.8 : 1 }] }>
          <Text variant="titleSmall" style={{ color: activeTab === 'search' ? theme.colors.primary : theme.colors.onBackground, fontWeight: '700' }}>Search</Text>
        </Pressable>
      </View>

      {/* Tab content */}
      {activeTab === 'search' ? (
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm }}>
          <TextInput
            placeholder="Search friends by name or email"
            value={query}
            onChangeText={setQuery}
            mode="outlined"
            style={{ marginBottom: spacing.sm }}
          />
          <FlatList
            data={searchResults ?? []}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: { item: any }) => (
              <ContactListItem
                title={item.name || item.email}
                subtitle={item.email}
                avatarLabel={(item.name || item.email).slice(0, 2).toUpperCase()}
                onPress={() => {
                  if (!addFriendMutation.loading) {
                    void addFriendMutation.mutate({ friendId: item.id }).then(() => {
                      setActiveTab('friends');
                      refetch();
                    }).catch(() => {});
                  }
                }}
              />
            )}
            ListEmptyComponent={listEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={Boolean(token) && searching}
                onRefresh={() => { /* noop */ }}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
          />
        </View>
      ) : activeTab === 'requests' ? (
        <FlatList
          data={localRequests ?? []}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <View style={{ paddingHorizontal: spacing.base }}>
              <ContactListItem
                title={item.from?.name || item.from?.email || 'Unknown'}
                subtitle={item.from?.email}
                avatarLabel={(item.from?.name || item.from?.email || 'U').slice(0, 2).toUpperCase()}
                onPress={() => { /* noop */ }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm }}>
                <Button
                  mode="contained"
                  compact
                  onPress={async () => {
                    // optimistic remove
                    setLocalRequests((prev) => (prev ? prev.filter((r) => r.id !== item.id) : prev));
                    try {
                      await friendRequestsHook.accept(item.id);
                      // on accept, refetch friends list
                      void refetch();
                    } catch (err) {
                      // revert on failure
                      setLocalRequests((prev) => (prev ? [item, ...prev] : [item]));
                    }
                  }}
                  style={{ backgroundColor: theme.colors.primary, borderRadius: borderRadius.sm }}
                >
                  Accept
                </Button>

                <Button
                  mode="outlined"
                  compact
                  onPress={async () => {
                    setLocalRequests((prev) => (prev ? prev.filter((r) => r.id !== item.id) : prev));
                    try {
                      await friendRequestsHook.reject(item.id);
                    } catch (err) {
                      setLocalRequests((prev) => (prev ? [item, ...prev] : [item]));
                    }
                  }}
                  style={{ borderRadius: borderRadius.sm }}
                >
                  Reject
                </Button>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                No pending requests
              </Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        // Friends tab
        <>
          {friendList.length > 0 && (
            <View style={styles.sectionHeader}>
              <Text
                variant="titleSmall"
                style={{
                  color: theme.colors.onBackground,
                  fontWeight: '700',
                }}
              >
                All Friends
              </Text>
            </View>
          )}

          <FlatList
            data={friendList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: any }) => (
              <ContactListItem
                title={item.name || item.email}
                subtitle={item.email}
                avatarLabel={(item.name || item.email).slice(0, 2).toUpperCase()}
                onPress={() => handleChatNow(item.id, item.name || item.email)}
                isOnline={Boolean(item.isOnline)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={listEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={Boolean(token) && loading}
                onRefresh={() => {
                  if (token) {
                    refetch();
                  }
                }}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
          />
        </>
      )}

      {/* Floating Add Friend button */}
      <FAB
        icon="account-plus"
        small={false}
        onPress={() => setActiveTab('search')}
        style={styles.fab}
        accessibilityLabel="Add Friend"
      />
    </SafeAreaView>
  );
};

export default FriendsScreen;

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
  storiesSection: {
    paddingVertical: spacing.md,
  },
  storiesContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  storyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  sectionHeader: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
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
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  requestsBadge: {
    marginLeft: spacing.xs,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: 36,
    backgroundColor: '#0ea5e9',
    elevation: 6,
  },
});
