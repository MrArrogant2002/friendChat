import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Divider,
  IconButton,
  List,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLogoutCallback, useProfileQuery } from '@/hooks/useAuthApi';
import { useSession } from '@/hooks/useSession';
import { useThemePreference } from '@/hooks/useThemePreference';
import { borderRadius, spacing } from '@/theme';
import type { AppTabsScreenProps } from '@/types/navigation';

const ProfileScreen: React.FC<AppTabsScreenProps<'Profile'>> = ({ navigation }) => {
  const theme = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { themeMode, setThemeMode } = useThemePreference();
  const { user: sessionUser, token } = useSession();
  const { data: profile } = useProfileQuery();
  const logout = useLogoutCallback();

  const resolvedUser = profile ?? sessionUser;

  const initials = useMemo(() => {
    if (!resolvedUser?.name) {
      return 'U';
    }
    const segments = resolvedUser.name.trim().split(' ');
    const letters = segments.slice(0, 2).map((segment) => segment.charAt(0).toUpperCase());
    return letters.join('');
  }, [resolvedUser?.name]);

  // Generate gradient colors based on initials
  const getAvatarGradient = (label: string) => {
    const gradients = [
      ['#667eea', '#764ba2'], // Purple
      ['#f093fb', '#f5576c'], // Pink
      ['#4facfe', '#00f2fe'], // Blue
      ['#43e97b', '#38f9d7'], // Green
      ['#fa709a', '#fee140'], // Orange
      ['#30cfd0', '#330867'], // Teal
      ['#a8edea', '#fed6e3'], // Pastel
      ['#ff9a9e', '#fecfef'], // Rose
    ];
    
    const charCode = label.charCodeAt(0) || 0;
    return gradients[charCode % gradients.length];
  };

  const gradientColors = getAvatarGradient(initials);

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to edit profile screen or show modal
    console.log('Edit profile');
  };

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Cycle through: light -> dark -> system -> light
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  const handleSignOut = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleLarge" style={{ color: theme.colors.onBackground, fontWeight: '700', fontSize: 24 }}>
          FriendlyChat
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Card */}
        <View style={[styles.profileHeader, { backgroundColor: theme.colors.background }]}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              label={initials}
              size={100}
              style={{ backgroundColor: gradientColors[0] }}
              labelStyle={{
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: 40,
              }}
            />
            {token && (
              <Pressable
                onPress={handleEditProfile}
                style={({ pressed }) => [
                  styles.editIconButton,
                  {
                    backgroundColor: theme.dark ? '#FFFFFF' : theme.colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <IconButton icon="pencil" size={14} iconColor={theme.dark ? theme.colors.primary : '#FFFFFF'} style={{ margin: 0, padding: 0 }} />
              </Pressable>
            )}
          </View>
          <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, fontWeight: '700', marginTop: spacing.md }}>
            {resolvedUser?.name ?? 'User'}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }}>
            {resolvedUser?.email ?? 'user@example.com'}
          </Text>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.md, paddingHorizontal: spacing.md, fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>
            PREFERENCES
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
            <List.Item
              title="Notifications"
              description="Receive chat notifications"
              left={(props) => (
                <View style={[styles.iconWrapper, { backgroundColor: theme.dark ? 'rgba(66, 133, 244, 0.25)' : 'rgba(66, 133, 244, 0.12)' }]}>
                  <IconButton 
                    icon="bell-outline" 
                    size={18} 
                    iconColor={theme.dark ? '#5E97F6' : theme.colors.primary} 
                    style={{ margin: 0, padding: 0 }} 
                  />
                </View>
              )}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(value: boolean) => {
                    setNotificationsEnabled(value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  disabled={!token}
                  color={theme.colors.primary}
                />
              )}
              style={styles.listItemNoPadding}
              titleStyle={{ color: theme.colors.onBackground, fontSize: 16, fontWeight: '600' }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
            />

            <Divider style={{ marginVertical: spacing.sm, marginHorizontal: spacing.md, backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.12)' : undefined }} />

            {/* Theme Toggle Button */}
            <List.Item
              title="Appearance"
              description="Customize your theme"
              left={(props) => (
                <View style={[styles.iconWrapper, { backgroundColor: theme.dark ? 'rgba(244, 143, 177, 0.25)' : 'rgba(244, 143, 177, 0.12)' }]}>
                  <IconButton 
                    icon="palette-outline" 
                    size={18} 
                    iconColor={theme.dark ? '#F48FB1' : theme.colors.primary} 
                    style={{ margin: 0, padding: 0 }} 
                  />
                </View>
              )}
              right={() => (
                <Pressable
                  onPress={handleThemeToggle}
                  disabled={!token}
                  style={({ pressed }) => [
                    styles.themeToggleButton,
                    {
                      backgroundColor: theme.colors.primaryContainer,
                      opacity: pressed ? 0.7 : !token ? 0.5 : 1,
                    },
                  ]}
                >
                  <IconButton
                    icon={
                      themeMode === 'light'
                        ? 'white-balance-sunny'
                        : themeMode === 'dark'
                        ? 'moon-waning-crescent'
                        : 'brightness-auto'
                    }
                    size={20}
                    iconColor={theme.colors.primary}
                    style={{ margin: 0, padding: 0 }}
                  />
                  <Text
                    variant="labelMedium"
                    style={{
                      color: theme.colors.primary,
                      fontWeight: '700',
                      marginLeft: spacing.xs,
                    }}
                  >
                    {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
                  </Text>
                </Pressable>
              )}
              style={styles.listItemNoPadding}
              titleStyle={{ color: theme.colors.onBackground, fontSize: 16, fontWeight: '600' }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.md, paddingHorizontal: spacing.md, fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>
            ACCOUNT
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
            <List.Item
              title="Privacy"
              description="Manage your privacy settings"
              left={(props) => (
                <View style={[styles.iconWrapper, { backgroundColor: theme.dark ? 'rgba(76, 175, 80, 0.25)' : 'rgba(76, 175, 80, 0.12)' }]}>
                  <IconButton 
                    icon="shield-lock-outline" 
                    size={18} 
                    iconColor={theme.dark ? '#66BB6A' : '#4CAF50'} 
                    style={{ margin: 0, padding: 0 }} 
                  />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.listItemNoPadding}
              titleStyle={{ color: theme.colors.onBackground, fontSize: 16, fontWeight: '600' }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
            />

            <Divider style={{ marginVertical: spacing.sm, marginHorizontal: spacing.md, backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.12)' : undefined }} />

            <List.Item
              title="Storage and Data"
              description="Manage storage usage"
              left={(props) => (
                <View style={[styles.iconWrapper, { backgroundColor: theme.dark ? 'rgba(255, 152, 0, 0.25)' : 'rgba(255, 152, 0, 0.12)' }]}>
                  <IconButton 
                    icon="database-outline" 
                    size={18} 
                    iconColor={theme.dark ? '#FFB74D' : '#FF9800'} 
                    style={{ margin: 0, padding: 0 }} 
                  />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.listItemNoPadding}
              titleStyle={{ color: theme.colors.onBackground, fontSize: 16, fontWeight: '600' }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
            />

            <Divider style={{ marginVertical: spacing.sm, marginHorizontal: spacing.md, backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.12)' : undefined }} />

            <List.Item
              title="Help & Support"
              description="Get help with FriendlyChat"
              left={(props) => (
                <View style={[styles.iconWrapper, { backgroundColor: theme.dark ? 'rgba(156, 39, 176, 0.25)' : 'rgba(156, 39, 176, 0.12)' }]}>
                  <IconButton 
                    icon="help-circle-outline" 
                    size={18} 
                    iconColor={theme.dark ? '#BA68C8' : '#9C27B0'} 
                    style={{ margin: 0, padding: 0 }} 
                  />
                </View>
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.listItemNoPadding}
              titleStyle={{ color: theme.colors.onBackground, fontSize: 16, fontWeight: '600' }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
            />
          </View>
        </View>

        {/* Logout Button */}
        {token && (
          <View style={[styles.logoutSection, { paddingBottom: spacing.xxl }]}>
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.modernLogoutButton,
                {
                  backgroundColor: theme.dark ? 'rgba(244, 67, 54, 0.18)' : 'rgba(244, 67, 54, 0.12)',
                  borderColor: theme.dark ? 'rgba(244, 67, 54, 0.4)' : 'rgba(244, 67, 54, 0.25)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={[styles.logoutIconWrapper, { backgroundColor: theme.dark ? 'rgba(244, 67, 54, 0.25)' : 'rgba(244, 67, 54, 0.18)' }]}>
                <IconButton 
                  icon="logout-variant" 
                  size={18} 
                  iconColor={theme.dark ? '#EF5350' : '#F44336'} 
                  style={{ margin: 0, padding: 0 }} 
                />
              </View>
              <Text style={{ color: theme.dark ? '#EF5350' : '#F44336', fontWeight: '700', fontSize: 16 }}>
                Sign Out
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingBottom: 100, // Space for floating tab bar
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  editIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  section: {
    marginBottom: spacing.md,
  },
  settingsCard: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  listItemNoPadding: {
    paddingVertical: spacing.xs,
  },
  themeToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  logoutSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  modernLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    gap: spacing.md,
    borderWidth: 1.5,
    minWidth: 200,
  },
  logoutIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
