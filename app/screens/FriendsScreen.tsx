import type { NavigationProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { MotiView } from 'moti';
import React, { useCallback, useMemo } from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    Button,
    HelperText,
    IconButton,
    Surface,
    Text,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFriendsList } from '@/hooks/useFriends';
import { useSession } from '@/hooks/useSession';
import type { FriendProfile } from '@/lib/api/types';
import { borderRadius, chatColors, shadows, spacing } from '@/theme';
import type { AppTabsScreenProps, RootStackParamList } from '@/types/navigation';

const FriendsScreen: React.FC<AppTabsScreenProps<'Friends'>> = ({ navigation }) => {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const colors = theme.dark ? chatColors.dark : chatColors.light;
  const { token, user } = useSession();
  const { data: friends, loading, error, refetch } = useFriendsList({ enabled: Boolean(token) });

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
    ({ item, index }: { item: FriendProfile; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateX: -20, scale: 0.95 }}
        animate={{ opacity: 1, translateX: 0, scale: 1 }}
        transition={{
          type: 'spring',
          damping: 15,
          delay: index * 50,
        }}
      >
        <Pressable
          onPress={() => handleChatNow(item.id, item.name || item.email)}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Surface
            elevation={1}
            style={[
              styles.friendItem,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.borderColor,
              },
              shadows.sm,
            ]}
          >
            <Avatar.Text
              label={(item.name || item.email).slice(0, 2).toUpperCase()}
              size={56}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              labelStyle={{
                color: theme.colors.onPrimaryContainer,
                fontWeight: '700',
              }}
            />
            <View style={styles.friendInfo}>
              <Text
                variant="titleMedium"
                style={{
                  color: colors.textPrimary,
                  fontWeight: '600',
                }}
                numberOfLines={1}
              >
                {item.name || item.email}
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
                numberOfLines={1}
              >
                {item.email}
              </Text>
            </View>
            <Surface
              elevation={2}
              style={[
                styles.chatButton,
                { backgroundColor: theme.colors.primary },
                shadows.md,
              ]}
            >
              <IconButton
                icon="chat"
                size={22}
                iconColor={theme.colors.onPrimary}
                style={{ margin: 0 }}
              />
            </Surface>
          </Surface>
        </Pressable>
      </MotiView>
    ),
    [handleChatNow, theme.colors, colors]
  );

  const listEmptyComponent = useMemo(() => {
    if (!token) {
      return (
        <Surface
          elevation={0}
          style={[
            styles.emptyState,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text
            variant="bodyLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center',
            }}
          >
            Sign in to view your friends.
          </Text>
        </Surface>
      );
    }

    if (loading) {
      return (
        <Surface
          elevation={0}
          style={[
            styles.emptyState,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <ActivityIndicator animating size="large" color={theme.colors.primary} />
        </Surface>
      );
    }

    if (error) {
      return (
        <Surface
          elevation={0}
          style={[
            styles.emptyState,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <HelperText type="error" visible>
            {error.message}
          </HelperText>
          <Button mode="contained" onPress={refetch} style={{ marginTop: spacing.md }}>
            Retry
          </Button>
        </Surface>
      );
    }

    return (
      <Surface
        elevation={0}
        style={[
          styles.emptyState,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Text
          variant="headlineSmall"
          style={{
            color: theme.colors.onSurface,
            textAlign: 'center',
            fontWeight: '600',
          }}
        >
          No friends yet
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
            marginTop: spacing.sm,
          }}
        >
          Use the button above to find friends
        </Text>
      </Surface>
    );
  }, [error, loading, refetch, theme.colors, token]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Surface elevation={1} style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text
          variant="titleLarge"
          style={{
            color: theme.colors.onSurface,
            fontWeight: '600',
          }}
        >
          My Friends
        </Text>
        <Button
          mode="contained"
          onPress={handleAddFriend}
          icon="account-plus"
          contentStyle={{ paddingVertical: spacing.xs }}
        >
          Add Friend
        </Button>
      </Surface>

      <FlatList
        data={friendList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
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
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    borderWidth: 1,
  },
  friendInfo: {
    flex: 1,
  },
  chatButton: {
    borderRadius: borderRadius.full,
    width: 44,
    height: 44,
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
});
