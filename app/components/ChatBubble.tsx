import React, { memo } from 'react';
import {
    Image,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

import type { Message, MessageAttachment } from '@/lib/api/types';
import { borderRadius, spacing } from '@/theme';

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  isPending?: boolean;
  senderName?: string;
  onLongPress?: () => void;
  onPress?: () => void;
  index?: number;
}

function formatDuration(durationMillis: number | null | undefined): string {
  const totalSeconds = Math.max(0, Math.floor((durationMillis ?? 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getAttachmentDuration(attachment: MessageAttachment): number | null {
  if (!attachment.metadata || typeof attachment.metadata !== 'object') {
    return null;
  }

  const duration = (attachment.metadata as Record<string, unknown>).durationMillis;
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return duration;
  }

  return null;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isMine,
  isPending = false,
  senderName,
  onLongPress,
  onPress,
  index = 0,
}) => {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const maxBubbleWidth = screenWidth * 0.75; // 75% of screen width

  // Modern bubble colors
  const bubbleBackgroundColor = isMine 
    ? theme.colors.primary 
    : (theme.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)');
  const textColor = isMine ? '#FFFFFF' : theme.colors.onBackground;

  const renderAttachment = (attachment: MessageAttachment, attachmentIndex: number) => {
    if (attachment.kind === 'image' && attachment.url) {
      return (
        <Image
          key={`${attachment.url}-${attachmentIndex}`}
          source={{ uri: attachment.url }}
          style={[
            styles.imageAttachment,
            { maxWidth: maxBubbleWidth - spacing.md * 2 },
          ]}
          resizeMode="cover"
        />
      );
    }

    if (attachment.kind === 'audio' && attachment.url) {
      const duration = getAttachmentDuration(attachment);
      return (
        <View key={`${attachment.url}-${attachmentIndex}`} style={styles.audioAttachment}>
          <Text variant="bodySmall" style={{ color: textColor }}>
            🎵 Voice Message
          </Text>
          {duration !== null && (
            <Text variant="labelSmall" style={[styles.audioDuration, { color: textColor }]}>
              {formatDuration(duration)}
            </Text>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, isMine ? styles.alignRight : styles.alignLeft]}>
      <Pressable
        onLongPress={onLongPress}
        onPress={onPress}
        style={({ pressed }: { pressed: boolean }) => [
          {
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Surface
          elevation={0}
          style={[
            styles.bubble,
            {
              backgroundColor: bubbleBackgroundColor,
              maxWidth: maxBubbleWidth,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              borderBottomRightRadius: isMine ? spacing.xs : borderRadius.xl,
              borderBottomLeftRadius: isMine ? borderRadius.xl : spacing.xs,
            },
          ]}
        >
          {/* Sender name for received messages */}
          {!isMine && senderName && (
            <Text
              variant="labelMedium"
              style={[
                styles.senderName,
                {
                  color: theme.dark ? '#5E97F6' : theme.colors.primary,
                },
              ]}
            >
              {senderName}
            </Text>
          )}

          {/* Message content */}
          {message.content && (
            <Text
              variant="bodyMedium"
              style={[
                styles.messageText,
                {
                  color: textColor,
                },
              ]}
            >
              {message.content}
            </Text>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {message.attachments.map((attachment: MessageAttachment, idx: number) =>
                renderAttachment(attachment, idx)
              )}
            </View>
          )}

          {/* Timestamp and status */}
          {message.createdAt && (
            <View style={styles.footer}>
              <Text
                variant="labelSmall"
                style={[
                  styles.timestamp,
                  {
                    color: isMine
                      ? 'rgba(255, 255, 255, 0.7)' // 70% opacity white for sent messages
                      : theme.colors.onSurfaceVariant, // Standard secondary text
                  },
                ]}
              >
                {new Date(message.createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>

              {/* Status indicator for sent messages */}
              {isMine && (
                <Text
                  style={[
                    styles.statusIcon,
                    {
                      color: isPending ? 'rgba(255, 255, 255, 0.4)' : '#FFFFFF',
                    },
                  ]}
                >
                  {isPending ? '○' : '✓'}
                </Text>
              )}
            </View>
          )}
        </Surface>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    minWidth: 80,
  },
  senderName: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  messageText: {
    lineHeight: 20,
  },
  attachmentsContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  imageAttachment: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  audioAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  audioDuration: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default memo(ChatBubble);
