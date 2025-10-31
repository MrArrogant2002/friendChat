import { MotiView } from 'moti';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';

import { borderRadius, spacing } from '@/theme';

export const TypingIndicator: React.FC = () => {
  const theme = useTheme();

  return (
    <Surface
      elevation={1}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <MotiView
            key={index}
            from={{ opacity: 0.3, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: 'timing',
              duration: 600,
              delay: index * 200,
              loop: true,
            }}
          >
            <View style={[styles.dot, { backgroundColor: theme.colors.onSurfaceVariant }]} />
          </MotiView>
        ))}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.xs,
    borderWidth: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
