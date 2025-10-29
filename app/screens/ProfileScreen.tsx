import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Divider,
  HelperText,
  IconButton,
  Surface,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLogoutCallback, useProfileQuery } from '@/hooks/useAuthApi';
import { useSession } from '@/hooks/useSession';
import { useThemePreference } from '@/hooks/useThemePreference';
import { borderRadius, shadows, spacing } from '@/theme';
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
        >
          <Surface elevation={1} style={[styles.header, { backgroundColor: theme.colors.surface }]}>
            <Text
              variant="titleLarge"
              style={{
                color: theme.colors.onSurface,
                fontWeight: '600',
              }}
            >
              Profile
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: spacing.xs,
              }}
            >
              Personalize your account and manage preferences
            </Text>
          </Surface>
        </MotiView>

        {/* Profile Identity Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
        >
          <Surface
            elevation={1}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
              shadows.md,
            ]}
          >
            <View style={styles.identityRow}>
              <Avatar.Text
                label={initials}
                size={64}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                labelStyle={{
                  color: theme.colors.onPrimaryContainer,
                  fontWeight: '600',
                  fontSize: 24,
                }}
              />
              <View style={styles.userInfo}>
                <Text
                  variant="titleLarge"
                  style={{
                    color: theme.colors.onSurface,
                    fontWeight: '600',
                  }}
                >
                  {resolvedUser?.name ?? 'FriendChat User'}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginTop: spacing.xs,
                  }}
                >
                  {resolvedUser?.email ?? 'Sign in to sync your profile'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                styles.editButton,
                {
                  backgroundColor: theme.colors.primaryContainer,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              disabled={!token || profileLoading}
            >
              <IconButton icon="pencil" size={20} iconColor={theme.colors.onPrimaryContainer} />
              <Text
                variant="labelLarge"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  fontWeight: '600',
                }}
              >
                Edit Profile
              </Text>
            </Pressable>
          </Surface>
        </MotiView>

        {/* Settings Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
        >
          <Surface
            elevation={1}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
              shadows.md,
            ]}
          >
            <Text
              variant="titleMedium"
              style={{
                color: theme.colors.onSurface,
                fontWeight: '600',
                marginBottom: spacing.md,
              }}
            >
              Settings
            </Text>

            {/* Notifications Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text
                  variant="bodyLarge"
                  style={{
                    color: theme.colors.onSurface,
                    fontWeight: '500',
                  }}
                >
                  Notifications
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginTop: spacing.xs,
                  }}
                >
                  Receive chat mentions and updates
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  setNotificationsEnabled(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                disabled={!token}
                color={theme.colors.primary}
              />
            </View>

            <Divider style={styles.divider} />

            {/* Theme Selection */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text
                  variant="bodyLarge"
                  style={{
                    color: theme.colors.onSurface,
                    fontWeight: '500',
                  }}
                >
                  Theme
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginTop: spacing.xs,
                  }}
                >
                  Choose your preferred theme
                </Text>
              </View>
            </View>

            <View style={styles.themeOptions}>
              {(['system', 'light', 'dark'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => {
                    setThemeMode(mode);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  disabled={!token}
                  style={({ pressed }) => [
                    styles.themeButton,
                    {
                      backgroundColor:
                        themeMode === mode ? theme.colors.primaryContainer : theme.colors.surface,
                      borderColor:
                        themeMode === mode ? theme.colors.primary : theme.colors.outlineVariant,
                      opacity: pressed ? 0.7 : !token ? 0.5 : 1,
                    },
                  ]}
                >
                  <IconButton
                    icon={
                      mode === 'system'
                        ? 'brightness-auto'
                        : mode === 'light'
                          ? 'white-balance-sunny'
                          : 'moon-waning-crescent'
                    }
                    size={20}
                    iconColor={
                      themeMode === mode ? theme.colors.onPrimaryContainer : theme.colors.onSurface
                    }
                  />
                  <Text
                    variant="labelMedium"
                    style={{
                      color:
                        themeMode === mode
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurface,
                      fontWeight: themeMode === mode ? '600' : '500',
                    }}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {profileError && (
              <HelperText type="error" visible={Boolean(profileError)}>
                {profileError.message}
              </HelperText>
            )}
          </Surface>
        </MotiView>

        {/* Account Actions Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
        >
          <Surface
            elevation={1}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
              shadows.md,
            ]}
          >
            <Text
              variant="titleMedium"
              style={{
                color: theme.colors.onSurface,
                fontWeight: '600',
                marginBottom: spacing.sm,
              }}
            >
              Account Actions
            </Text>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <IconButton icon="link-variant" size={20} iconColor={theme.colors.primary} />
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurface,
                  flex: 1,
                }}
              >
                Manage connected providers
              </Text>
              <IconButton
                icon="chevron-right"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <IconButton icon="download" size={20} iconColor={theme.colors.primary} />
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurface,
                  flex: 1,
                }}
              >
                Export data snapshot
              </Text>
              <IconButton
                icon="chevron-right"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSignOut();
              }}
              disabled={!token}
              style={({ pressed }) => [
                styles.signOutButton,
                {
                  backgroundColor: theme.colors.errorContainer,
                  opacity: pressed ? 0.7 : !token ? 0.5 : 1,
                },
              ]}
            >
              <IconButton icon="logout" size={20} iconColor={theme.colors.error} />
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.error,
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                Sign Out
              </Text>
            </Pressable>
          </Surface>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
});
