import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

import { borderRadius, spacing } from '@/theme';

interface TypingIndicatorProps {
  names?: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ names = [] }) => {
  const theme = useTheme();

  if (names.length === 0) {
    return null;
  }

  // Format the typing text based on number of users
  const getTypingText = () => {
    if (names.length === 1) {
      return `${names[0]} is typing`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing`;
    } else {
      return `${names[0]} and ${names.length - 1} others are typing`;
    }
  };

  return (
    <View>
      <Surface
        elevation={1}
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Text
          variant="labelSmall"
          style={[styles.text, { color: theme.colors.onSurfaceVariant }]}
        >
          {getTypingText()}
        </Text>
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <View key={index}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
            </View>
          ))}
        </View>
      </Surface>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    fontStyle: 'italic',
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

export default TypingIndicator;
