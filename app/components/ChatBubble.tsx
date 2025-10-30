import { MotiView } from 'moti';
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
import { borderRadius, chatColors, shadows, spacing } from '@/theme';

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
  const colors = theme.dark ? chatColors.dark : chatColors.light;

  const maxBubbleWidth = screenWidth * 0.65; // 65% of screen width

  const bubbleBackgroundColor = isMine ? colors.messageSent : colors.messageReceived;
  const textColor = isMine ? colors.textOnSent : colors.textOnReceived;

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
    <MotiView
      from={{ opacity: 0, translateY: 20, scale: 0.95 }}
      animate={{ opacity: isPending ? 0.7 : 1, translateY: 0, scale: 1 }}
      transition={{
        type: 'timing',
        duration: 300,
        delay: index < 5 ? index * 50 : 0, // Stagger animation for first 5 messages
      }}
      style={[styles.container, isMine ? styles.alignRight : styles.alignLeft]}
    >
      <Pressable
        onLongPress={onLongPress}
        onPress={onPress}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Surface
          elevation={2}
          style={[
            styles.bubble,
            {
              backgroundColor: bubbleBackgroundColor,
              maxWidth: maxBubbleWidth,
              borderBottomRightRadius: isMine ? spacing.xs : borderRadius.xl,
              borderBottomLeftRadius: isMine ? borderRadius.xl : spacing.xs,
            },
            shadows.md,
          ]}
        >
          {/* Sender name for received messages */}
          {!isMine && senderName && (
            <Text
              variant="labelMedium"
              style={[
                styles.senderName,
                {
                  color: theme.dark ? '#1C1C1C' : '#2A4A4A',
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
              {message.attachments.map((attachment, idx) =>
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
                      ? `${textColor}99` // 60% opacity
                      : `${textColor}CC`, // 80% opacity
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
                      color: isPending ? `${textColor}66` : colors.accent,
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
    </MotiView>
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
