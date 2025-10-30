import type { NavigationProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    Button,
    HelperText,
    Text,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import ContactListItem from '@/components/ContactListItem';
import { useFriendsList } from '@/hooks/useFriends';
import { useSession } from '@/hooks/useSession';
import type { FriendProfile } from '@/lib/api/types';
import { borderRadius, spacing } from '@/theme';
import type { AppTabsScreenProps, RootStackParamList } from '@/types/navigation';

const FriendsScreen: React.FC<AppTabsScreenProps<'Friends'>> = ({ navigation }) => {
  const theme = useTheme();
  const { token, user } = useSession();
  const { data: friends, loading, error, refetch, isStale } = useFriendsList({ enabled: Boolean(token) });

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
      </View>

      {/* Story-style Your Story Section */}
      <View
        style={[
          styles.storiesSection,
          { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.outline },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContent}>
          {/* Your Story */}
          <Pressable style={styles.storyItem}>
            <View
              style={[
                styles.storyCircle,
                {
                  backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: theme.colors.outline,
                },
              ]}
            >
              <Avatar.Text
                size={64}
                label={user?.name?.slice(0, 2).toUpperCase() || 'U'}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                labelStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 24 }}
              />
              <View style={[styles.addStoryBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>+</Text>
              </View>
            </View>
            <Text
              variant="labelSmall"
              style={{
                color: theme.colors.onBackground,
                marginTop: spacing.xs,
                textAlign: 'center',
              }}
            >
              Your story
            </Text>
          </Pressable>

          {/* Sample friend stories (placeholder) */}
          {friendList.slice(0, 5).map((friend, index) => (
            <Pressable key={friend.id} style={styles.storyItem}>
              <View
                style={[
                  styles.storyCircle,
                  {
                    borderColor: theme.colors.primary,
                    borderWidth: 2,
                  },
                ]}
              >
                <Avatar.Text
                  size={64}
                  label={(friend.name || friend.email).slice(0, 2).toUpperCase()}
                  style={{ backgroundColor: theme.colors.secondaryContainer }}
                  labelStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 24 }}
                />
              </View>
              <Text
                variant="labelSmall"
                numberOfLines={1}
                style={{
                  color: theme.colors.onBackground,
                  marginTop: spacing.xs,
                  textAlign: 'center',
                  maxWidth: 72,
                }}
              >
                {(friend.name || friend.email).split(' ')[0]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Friends List Header */}
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

      {/* Friends List */}
      <FlatList
        data={friendList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
});
