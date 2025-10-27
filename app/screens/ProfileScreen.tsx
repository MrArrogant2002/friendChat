import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Divider,
  HelperText,
  List,
  Surface,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';

import { useLogoutCallback, useProfileQuery } from '@/hooks/useAuthApi';
import { useSession } from '@/hooks/useSession';
import { useThemePreference } from '@/hooks/useThemePreference';
import type { AppTabsScreenProps } from '@/types/navigation';

const ProfileScreen: React.FC<AppTabsScreenProps<'Profile'>> = ({ navigation }) => {
  const theme = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { themeMode, setThemeMode } = useThemePreference();
  const { user: sessionUser, token } = useSession();
  const { data: profile, error: profileError, loading: profileLoading } = useProfileQuery();
  const logout = useLogoutCallback();

  const resolvedUser = profile ?? sessionUser;

  const initials = useMemo(() => {
    if (!resolvedUser?.name) {
      return 'FC';
    }
    const segments = resolvedUser.name.trim().split(' ');
    const letters = segments.slice(0, 2).map((segment) => segment.charAt(0).toUpperCase());
    return letters.join('');
  }, [resolvedUser?.name]);

  const handleSignOut = () => {
    logout();
    const rootNavigator = navigation.getParent();
    rootNavigator?.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
        Profile
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
        Personalize your account and manage preferences.
      </Text>

      <Surface
        elevation={1}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceVariant,
          },
        ]}
      >
        <View style={styles.identityRow}>
          <Avatar.Text
            label={initials}
            size={56}
            style={{ backgroundColor: theme.colors.secondaryContainer }}
            labelStyle={{ color: theme.colors.onSecondaryContainer }}
          />
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {resolvedUser?.name ?? 'FriendChat User'}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {resolvedUser?.email ?? 'Sign in to sync your profile'}
            </Text>
          </View>
          <Button mode="outlined" onPress={() => undefined} disabled={!token || profileLoading}>
            Edit
          </Button>
        </View>
        <Divider style={styles.divider} />
        <List.Item
          title="Notifications"
          description="Receive chat mentions and chart updates"
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              disabled={!token}
            />
          )}
        />
        <List.Item
          title="Theme"
          description="Override system preference"
          right={() => (
            <View style={styles.themeOptions}>
              {(['system', 'light', 'dark'] as const).map((mode) => (
                <Button
                  key={mode}
                  mode={themeMode === mode ? 'contained' : 'text'}
                  onPress={() => setThemeMode(mode)}
                  compact
                  style={styles.themeButton}
                  disabled={!token}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </View>
          )}
        />
        <HelperText type="error" visible={Boolean(profileError)}>
          {profileError?.message ?? ''}
        </HelperText>
      </Surface>

      <Surface
        elevation={1}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceVariant,
          },
        ]}
      >
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Account actions
        </Text>
        <Button mode="text" onPress={() => undefined} style={styles.accountButton}>
          Manage connected providers
        </Button>
        <Button mode="text" onPress={() => undefined} style={styles.accountButton}>
          Export data snapshot
        </Button>
        <Button
          mode="contained-tonal"
          onPress={handleSignOut}
          style={styles.accountButton}
          disabled={!token}
        >
          Sign out
        </Button>
      </Surface>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    gap: 8,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    marginVertical: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    borderRadius: 999,
  },
  accountButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
