import type { NavigationProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    Button,
    Divider,
    HelperText,
    List,
    Surface,
    Text,
    useTheme,
} from 'react-native-paper';

import { useFriendsList } from '@/hooks/useFriends';
import { useSession } from '@/hooks/useSession';
import type { FriendProfile } from '@/lib/api/types';
import type { AppTabsScreenProps, RootStackParamList } from '@/types/navigation';

const FriendsScreen: React.FC<AppTabsScreenProps<'Friends'>> = ({ navigation }) => {
  const theme = useTheme();
  const { token, user } = useSession();
  const {
    data: friends,
    loading,
    error,
    refetch,
  } = useFriendsList({ enabled: Boolean(token) });

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
          <Button
            mode="contained"
            onPress={() => handleChatNow(item.id, item.name || item.email)}
            icon="chat"
            compact
          >
            Chat
          </Button>
        )}
        style={styles.listItem}
        titleStyle={{ color: theme.colors.onSurface }}
        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
      />
    ),
    [handleChatNow, theme.colors.onSecondaryContainer, theme.colors.onSurface, theme.colors.onSurfaceVariant, theme.colors.secondaryContainer]
  );

  const listEmptyComponent = useMemo(() => {
    if (!token) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Sign in to view your friends.
          </Text>
        </Surface>
      );
    }

    if (loading) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <ActivityIndicator animating size="small" />
        </Surface>
      );
    }

    if (error) {
      return (
        <Surface elevation={0} style={styles.emptyState}>
          <HelperText type="error" visible>
            {error.message}
          </HelperText>
          <Button mode="text" onPress={refetch}>
            Retry
          </Button>
        </Surface>
      );
    }

    return (
      <Surface elevation={0} style={styles.emptyState}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          You have not added any friends yet. Use the button above to find friends.
        </Text>
      </Surface>
    );
  }, [error, loading, refetch, theme.colors.onSurfaceVariant, token]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
          My Friends
        </Text>
        <Button mode="contained" onPress={handleAddFriend}>
          Add Friend
        </Button>
      </View>

      <FlatList
        data={friendList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Divider}
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
          />
        }
      />
    </View>
  );
};

export default FriendsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
