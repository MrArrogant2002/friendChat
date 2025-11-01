import { borderRadius, spacing } from '@/theme';
import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Surface, Text, useTheme } from 'react-native-paper';

interface ContactListItemProps {
  title: string;
  subtitle?: string;
  timestamp?: string;
  unreadCount?: number;
  avatarLabel?: string;
  isOnline?: boolean;
  onPress?: (e?: GestureResponderEvent) => void;
  onLongPress?: (e?: GestureResponderEvent) => void;
}

const ContactListItem: React.FC<ContactListItemProps> = ({
  title,
  subtitle,
  timestamp,
  unreadCount,
  avatarLabel,
  onPress,
  onLongPress,
  isOnline,
}) => {
  const theme = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

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

  const gradientColors = getAvatarGradient(avatarLabel || '?');

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: spacing.sm }}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }: { pressed: boolean }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <Surface
          elevation={0}
          style={[
            styles.container,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.avatarWrapper}>
            <Avatar.Text
              label={(avatarLabel || '?').slice(0, 2).toUpperCase()}
              size={60}
              style={{ backgroundColor: gradientColors[0] }}
              labelStyle={{ color: '#FFFFFF', fontWeight: '700', fontSize: 22 }}
            />
            {/* Online status indicator - can be made dynamic */}
            {/* Online status indicator - shown only when user is online */}
            {isOnline ? (
              <View style={[styles.onlineIndicator, { borderColor: theme.colors.surface }]} />
            ) : null}
          </View>

          <View style={styles.content}>
            <View style={styles.rowTop}>
              <Text variant="titleMedium" numberOfLines={1} style={{ flex: 1, fontWeight: '600', fontSize: 16 }}>
                {title}
              </Text>
              {timestamp ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                  {timestamp}
                </Text>
              ) : null}
            </View>

            {subtitle ? (
              <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.xs, fontSize: 14 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          {unreadCount !== undefined && unreadCount > 0 ? (
            <Surface style={[styles.badge, { backgroundColor: theme.colors.primary }]} elevation={2}>
              <Text variant="labelSmall" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </Surface>
          ) : null}
        </Surface>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ade80',
    borderWidth: 2,
  },
  content: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ContactListItem;
