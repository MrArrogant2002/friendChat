import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

import { borderRadius, shadows, spacing } from '@/theme';

interface ScrollToBottomButtonProps {
  visible: boolean;
  onPress: () => void;
  unreadCount?: number;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  visible,
  onPress,
  unreadCount,
}) => {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
          shadows.lg,
        ]}
      >
        <Icon source="chevron-down" size={24} color={theme.colors.onPrimary} />
        {unreadCount !== undefined && unreadCount > 0 && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.error,
              },
            ]}
          />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl + spacing.lg, // Above the input area
    right: spacing.md,
    zIndex: 999,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default ScrollToBottomButton;
