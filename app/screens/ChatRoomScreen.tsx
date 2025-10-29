import { MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  HelperText,
  IconButton,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TypingIndicator } from '@/components/TypingIndicator';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useMessagesQuery, useSendMessageMutation } from '@/hooks/useChatApi';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useSession } from '@/hooks/useSession';
import type { Message as ApiMessage, MessageAttachment } from '@/lib/api/types';
import { borderRadius, shadows, spacing } from '@/theme';
import type { RootStackScreenProps } from '@/types/navigation';

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

const ChatRoomScreen: React.FC<RootStackScreenProps<'ChatRoom'>> = ({ route }) => {
  const { chatId, title } = route.params;
  const theme = useTheme();
  const { token, user } = useSession();
  const [draft, setDraft] = useState('');
  const [conversation, setConversation] = useState<ApiMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const {
    data: remoteMessages,
    loading: isLoadingMessages,
    error: messagesError,
    refetch,
  } = useMessagesQuery(chatId, { enabled: Boolean(token) });
  const {
    mutate: sendMessage,
    loading: isSending,
    error: sendError,
    reset: resetSendError,
  } = useSendMessageMutation();
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const {
    pickImage,
    captureImage,
    loading: isPickingImage,
    error: imagePickerError,
    reset: resetImageError,
  } = useImagePicker();
  const {
    startRecording,
    stopRecording,
    status: recordingStatus,
    error: audioRecorderError,
    reset: resetAudioError,
  } = useAudioRecorder();

  const isRecording = recordingStatus === 'recording';
  const isStoppingRecording = recordingStatus === 'stopping';

  const upsertMessage = useCallback((incoming: ApiMessage) => {
    setConversation((prev) => {
      const index = prev.findIndex((item) => item.id === incoming.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = incoming;
        return next;
      }
      // New message added - return new array
      return [...prev, incoming];
    });
  }, []);

  const handleIncomingMessage = useCallback(
    (message: ApiMessage) => {
      upsertMessage(message);
    },
    [upsertMessage]
  );

  const { status: socketStatus, error: socketError } = useChatSocket(chatId, {
    enabled: Boolean(token),
    onMessage: handleIncomingMessage,
  });

  const addAttachment = useCallback((attachment: MessageAttachment) => {
    setPendingAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  useEffect(() => {
    if (remoteMessages) {
      setConversation(remoteMessages);
    }
  }, [remoteMessages]);

  // Auto-scroll to bottom when conversation updates with new messages
  useEffect(() => {
    if (conversation.length > 0) {
      // Use a small delay to ensure FlatList has rendered the new content
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [conversation.length]); // Only trigger when the number of messages changes

  const handleSelectImageFromLibrary = useCallback(async () => {
    if (!token) {
      return;
    }

    if (imagePickerError) {
      resetImageError();
    }

    const image = await pickImage({ allowsEditing: true });

    if (!image) {
      return;
    }

    addAttachment({
      kind: 'image',
      url: image.uri,
      metadata: {
        width: image.width,
        height: image.height,
        fileSize: image.fileSize,
        fileName: image.fileName,
        mimeType: image.mimeType,
        source: image.fromCamera ? 'camera' : 'library',
      },
    });
  }, [addAttachment, imagePickerError, pickImage, resetImageError, token]);

  const handleCaptureImage = useCallback(async () => {
    if (!token) {
      return;
    }

    if (imagePickerError) {
      resetImageError();
    }

    const image = await captureImage({ allowsEditing: true });

    if (!image) {
      return;
    }

    addAttachment({
      kind: 'image',
      url: image.uri,
      metadata: {
        width: image.width,
        height: image.height,
        fileSize: image.fileSize,
        fileName: image.fileName,
        mimeType: image.mimeType,
        source: image.fromCamera ? 'camera' : 'library',
      },
    });
  }, [addAttachment, captureImage, imagePickerError, resetImageError, token]);

  const handleToggleRecording = useCallback(async () => {
    if (!token) {
      return;
    }

    if (audioRecorderError) {
      resetAudioError();
    }

    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        addAttachment({
          kind: 'audio',
          url: result.uri,
          metadata: {
            durationMillis: result.durationMillis,
            mimeType: result.mimeType,
            fileSize: result.fileSize,
          },
        });
      }
      return;
    }

    await startRecording();
  }, [
    addAttachment,
    audioRecorderError,
    isRecording,
    resetAudioError,
    startRecording,
    stopRecording,
    token,
  ]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!token) {
      return;
    }

    const hasText = trimmed.length > 0;
    const hasAttachments = pendingAttachments.length > 0;

    if (!hasText && !hasAttachments) {
      return;
    }

    try {
      const message = await sendMessage({
        chatId,
        content: hasText ? trimmed : undefined,
        attachments: hasAttachments ? pendingAttachments : undefined,
      });
      upsertMessage(message);
      setDraft('');
      setPendingAttachments([]);
    } catch {
      // Error already captured by the mutation hook; no further handling required.
    }
  };

  const handleDraftChange = (value: string) => {
    if (sendError) {
      resetSendError();
    }
    setDraft(value);
  };

  const listEmptyComponent = useMemo(() => {
    if (!token) {
      return (
        <Surface elevation={0} style={styles.emptyStateSurface}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Sign in to load this conversation.
          </Text>
        </Surface>
      );
    }

    if (isLoadingMessages) {
      return (
        <Surface elevation={0} style={styles.emptyStateSurface}>
          <ActivityIndicator animating size="small" />
        </Surface>
      );
    }

    if (messagesError) {
      return (
        <Surface elevation={0} style={styles.emptyStateSurface}>
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {messagesError.message}
          </Text>
          <Button mode="text" onPress={refetch} style={styles.retryButton}>
            Retry
          </Button>
        </Surface>
      );
    }

    return (
      <Surface elevation={0} style={styles.emptyStateSurface}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No messages yet. Be the first to say hello!
        </Text>
      </Surface>
    );
  }, [
    isLoadingMessages,
    messagesError,
    refetch,
    theme.colors.error,
    theme.colors.onSurfaceVariant,
    token,
  ]);

  const resolveSenderLabel = (message: ApiMessage) => {
    const senderId =
      typeof message.sender === 'string'
        ? message.sender
        : message.sender?.id || (message.sender as any)?._id?.toString();

    if (senderId && senderId === user?.id) {
      return 'You';
    }
    if (typeof message.sender === 'object' && message.sender?.name) {
      return message.sender.name;
    }
    return 'Participant';
  };

  const hasDraftContent = draft.trim().length > 0;
  const hasPendingAttachments = pendingAttachments.length > 0;
  const isComposerDisabled = !token || isSending || isStoppingRecording;
  const disableMediaActions =
    !token || isSending || isPickingImage || isStoppingRecording || isRecording;

  const socketStatusMessage = useMemo(() => {
    if (!token) {
      return null;
    }
    if (socketError) {
      return null;
    }
    if (socketStatus === 'connecting') {
      return 'Connecting to live updates…';
    }
    if (socketStatus === 'disconnected') {
      return 'Realtime connection lost. Retrying…';
    }
    return null;
  }, [socketError, socketStatus, token]);

  const renderPendingAttachment = useCallback(
    (attachment: MessageAttachment) => {
      if (attachment.kind === 'image') {
        return <Image source={{ uri: attachment.url }} style={styles.pendingImageAttachment} />;
      }

      if (attachment.kind === 'audio') {
        const durationMillis = getAttachmentDuration(attachment);
        const formatted = durationMillis ? formatDuration(durationMillis) : null;
        return (
          <View
            style={[
              styles.audioAttachment,
              {
                borderColor: theme.colors.surfaceVariant,
                backgroundColor: theme.colors.secondaryContainer,
              },
            ]}
          >
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              Pending audio
            </Text>
            {formatted ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formatted}
              </Text>
            ) : null}
          </View>
        );
      }

      return (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Attachment
        </Text>
      );
    },
    [
      theme.colors.onSurfaceVariant,
      theme.colors.primary,
      theme.colors.secondaryContainer,
      theme.colors.surfaceVariant,
    ]
  );

  const renderMessageAttachment = useCallback(
    (attachment: MessageAttachment) => {
      if (attachment.kind === 'image') {
        return <Image source={{ uri: attachment.url }} style={styles.messageImageAttachment} />;
      }

      if (attachment.kind === 'audio') {
        const durationMillis = getAttachmentDuration(attachment);
        const formatted = durationMillis ? formatDuration(durationMillis) : null;
        return (
          <View
            style={[
              styles.audioAttachment,
              {
                borderColor: theme.colors.surfaceVariant,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              Audio clip
            </Text>
            {formatted ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formatted}
              </Text>
            ) : null}
          </View>
        );
      }

      return (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Attachment available
        </Text>
      );
    },
    [
      theme.colors.onSurfaceVariant,
      theme.colors.primary,
      theme.colors.surface,
      theme.colors.surfaceVariant,
    ]
  );

  const listFooterComponent = useMemo(() => {
    return (
      <View>
        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}

        {/* Pending Attachments */}
        {pendingAttachments.length > 0 && (
          <View style={styles.pendingAttachmentsContainer}>
            {pendingAttachments.map((attachment, index) => (
              <Surface
                key={`${attachment.kind}-${index}-${attachment.url}`}
                elevation={2}
                style={[
                  styles.pendingAttachmentCard,
                  {
                    borderColor: theme.colors.outlineVariant,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                {renderPendingAttachment(attachment)}
                <IconButton
                  icon="close"
                  size={16}
                  onPress={() => removeAttachment(index)}
                  style={styles.removeAttachmentButton}
                  accessibilityLabel="Remove attachment"
                />
              </Surface>
            ))}
          </View>
        )}
      </View>
    );
  }, [isTyping, pendingAttachments, theme.colors, renderPendingAttachment, removeAttachment]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Text
          variant="headlineSmall"
          style={{ color: theme.colors.onBackground, marginBottom: 16 }}
        >
          {title}
        </Text>
        <FlatList
          ref={flatListRef}
          data={conversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={listEmptyComponent}
          ListFooterComponent={listFooterComponent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const senderId =
              typeof item.sender === 'string'
                ? item.sender
                : item.sender?.id || (item.sender as any)?._id?.toString();

            const isSentByMe = senderId === user?.id;

            return (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: 200,
                  delay: index < 5 ? index * 30 : 0,
                }}
              >
                <Surface
                  elevation={1}
                  style={[
                    styles.messageBubble,
                    {
                      backgroundColor: isSentByMe ? theme.colors.primaryContainer : '#93BFC7', // Soft blue for received messages
                      borderColor: isSentByMe ? theme.colors.primaryContainer : '#93BFC7',
                      alignSelf: isSentByMe ? 'flex-end' : 'flex-start',
                    },
                    shadows.sm,
                  ]}
                >
                  {!isSentByMe && (
                    <Text
                      variant="labelMedium"
                      style={{
                        color: theme.dark ? '#1C1C1C' : '#333333',
                        fontWeight: '600',
                        marginBottom: spacing.xs,
                      }}
                    >
                      {resolveSenderLabel(item)}
                    </Text>
                  )}
                  {item.content ? (
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: theme.dark ? '#1C1C1C' : '#333333',
                        lineHeight: 20,
                      }}
                    >
                      {item.content}
                    </Text>
                  ) : null}
                  {item.attachments?.length ? (
                    <View style={styles.messageAttachments}>
                      {item.attachments.map((attachment: any, index: number) => (
                        <View
                          key={`${attachment.url}-${index}`}
                          style={styles.messageAttachmentWrapper}
                        >
                          {renderMessageAttachment(attachment)}
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {item.createdAt && (
                    <Text
                      variant="labelSmall"
                      style={{
                        color: theme.dark ? 'rgba(28, 28, 28, 0.6)' : 'rgba(51, 51, 51, 0.6)',
                        marginTop: spacing.xs,
                        alignSelf: 'flex-end',
                        fontSize: 11,
                      }}
                    >
                      {new Date(item.createdAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  )}
                </Surface>
              </MotiView>
            );
          }}
        />

        <Surface
          style={[styles.composer, { borderColor: theme.colors.surfaceVariant }]}
          elevation={1}
        >
          <View style={styles.mediaActions}>
            <IconButton
              icon="paperclip"
              onPress={handleSelectImageFromLibrary}
              accessibilityLabel="Attach image from library"
              disabled={disableMediaActions}
              loading={isPickingImage}
            />
            <IconButton
              icon="camera"
              onPress={handleCaptureImage}
              accessibilityLabel="Capture image"
              disabled={disableMediaActions}
            />
            <IconButton
              icon={isRecording ? 'microphone-off' : 'microphone'}
              onPress={handleToggleRecording}
              accessibilityLabel={isRecording ? 'Stop recording audio' : 'Record audio message'}
              disabled={disableMediaActions && !isRecording}
              selected={isRecording}
              loading={isStoppingRecording}
            />
          </View>
          <TextInput
            value={draft}
            onChangeText={handleDraftChange}
            placeholder="Message"
            multiline
            mode="flat"
            style={styles.composerInput}
            editable={!isComposerDisabled}
          />
          <IconButton
            icon="send"
            onPress={handleSend}
            accessibilityLabel="Send message"
            disabled={(!hasDraftContent && !hasPendingAttachments) || isComposerDisabled}
            loading={isSending}
          />
        </Surface>
        {imagePickerError && (
          <HelperText type="error" visible={Boolean(imagePickerError)}>
            {imagePickerError.message}
          </HelperText>
        )}
        {audioRecorderError && (
          <HelperText type="error" visible={Boolean(audioRecorderError)}>
            {audioRecorderError.message}
          </HelperText>
        )}
        {isRecording && (
          <HelperText type="info" visible={isRecording}>
            Recording… tap the microphone to stop.
          </HelperText>
        )}
        {sendError && (
          <HelperText type="error" visible={Boolean(sendError)}>
            {sendError.message}
          </HelperText>
        )}
        {socketStatusMessage && (
          <HelperText type="info" visible={Boolean(socketStatusMessage)}>
            {socketStatusMessage}
          </HelperText>
        )}
        {socketError && (
          <HelperText type="error" visible={Boolean(socketError)}>
            {socketError.message}
          </HelperText>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoomScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listContent: {
    gap: 12,
    paddingBottom: 20,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 0,
    marginVertical: spacing.xs,
    maxWidth: '80%',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
    gap: spacing.xs,
    ...shadows.md,
  },
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
  },
  emptyStateSurface: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  pendingAttachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  pendingAttachmentCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    position: 'relative',
    justifyContent: 'center',
  },
  pendingImageAttachment: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  messageAttachments: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  messageAttachmentWrapper: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  messageImageAttachment: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.md,
  },
  audioAttachment: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    minWidth: 140,
    alignItems: 'flex-start',
  },
});
