import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
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

import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useMessagesQuery, useSendMessageMutation } from '@/hooks/useChatApi';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useSession } from '@/hooks/useSession';
import type { Message as ApiMessage, MessageAttachment } from '@/lib/api/types';
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
  }, [addAttachment, audioRecorderError, isRecording, resetAudioError, startRecording, stopRecording, token]);

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
  }, [isLoadingMessages, messagesError, refetch, theme.colors.error, theme.colors.onSurfaceVariant, token]);

  const resolveSenderLabel = (message: ApiMessage) => {
    const senderId = typeof message.sender === 'string' 
      ? message.sender 
      : (message.sender?.id || (message.sender as any)?._id?.toString());
    
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
        return (
          <Image source={{ uri: attachment.url }} style={styles.pendingImageAttachment} />
        );
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
        return (
          <Image source={{ uri: attachment.url }} style={styles.messageImageAttachment} />
        );
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
    [theme.colors.onSurfaceVariant, theme.colors.primary, theme.colors.surface, theme.colors.surfaceVariant]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, marginBottom: 16 }}>
        {title}
      </Text>
      <FlatList
        data={conversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={listEmptyComponent}
        renderItem={({ item }) => {
          const senderId = typeof item.sender === 'string' 
            ? item.sender 
            : (item.sender?.id || (item.sender as any)?._id?.toString());
          
          const isSentByMe = senderId === user?.id;
          
          return (
            <Surface
              elevation={1}
              style={[
                styles.messageBubble,
                {
                  backgroundColor: isSentByMe ? theme.colors.primaryContainer : theme.colors.surface,
                  borderColor: isSentByMe ? theme.colors.primary : theme.colors.surfaceVariant,
                  alignSelf: isSentByMe ? 'flex-end' : 'flex-start',
                },
              ]}
            >
              <Text
                variant="labelLarge"
                style={{ 
                  color: isSentByMe ? theme.colors.onPrimaryContainer : theme.colors.primary, 
                  textTransform: 'capitalize' 
                }}
              >
                {resolveSenderLabel(item)}
              </Text>
              {item.content ? (
                <Text variant="bodyMedium" style={{ 
                  color: isSentByMe ? theme.colors.onPrimaryContainer : theme.colors.onSurface 
                }}>
                  {item.content}
                </Text>
              ) : null}
              {item.attachments?.length ? (
                <View style={styles.messageAttachments}>
                  {item.attachments.map((attachment, index) => (
                    <View
                      key={`${attachment.url}-${index}`}
                      style={styles.messageAttachmentWrapper}
                    >
                      {renderMessageAttachment(attachment)}
                    </View>
                  ))}
                </View>
              ) : null}
            </Surface>
          );
        }}
      />

      {pendingAttachments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pendingAttachmentsScroll}
          contentContainerStyle={styles.pendingAttachmentsContent}
        >
          {pendingAttachments.map((attachment, index) => (
            <Surface
              key={`${attachment.kind}-${index}-${attachment.url}`}
              elevation={2}
              style={[
                styles.pendingAttachmentCard,
                {
                  borderColor: theme.colors.surfaceVariant,
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
        </ScrollView>
      )}

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
      <HelperText type="error" visible={Boolean(imagePickerError)}>
        {imagePickerError?.message ?? ''}
      </HelperText>
      <HelperText type="error" visible={Boolean(audioRecorderError)}>
        {audioRecorderError?.message ?? ''}
      </HelperText>
      <HelperText type="info" visible={isRecording}>
        Recording… tap the microphone to stop.
      </HelperText>
      <HelperText type="error" visible={Boolean(sendError)}>
        {sendError?.message ?? ''}
      </HelperText>
      <HelperText type="info" visible={Boolean(socketStatusMessage)}>
        {socketStatusMessage ?? ''}
      </HelperText>
      <HelperText type="error" visible={Boolean(socketError)}>
        {socketError?.message ?? ''}
      </HelperText>
    </View>
  );
};

export default ChatRoomScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  listContent: {
    gap: 12,
    paddingBottom: 120,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    maxWidth: '85%',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 4,
    marginTop: 12,
    gap: 4,
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
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButton: {
    marginTop: 8,
  },
  pendingAttachmentsScroll: {
    marginTop: 12,
    maxHeight: 140,
  },
  pendingAttachmentsContent: {
    gap: 12,
    paddingVertical: 4,
  },
  pendingAttachmentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  pendingImageAttachment: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  messageAttachments: {
    marginTop: 8,
    gap: 8,
  },
  messageAttachmentWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImageAttachment: {
    width: 180,
    height: 180,
    borderRadius: 12,
  },
  audioAttachment: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 2,
    minWidth: 140,
    alignItems: 'flex-start',
  },
});
