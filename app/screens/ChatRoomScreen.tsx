import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  HelperText,
  IconButton,
  Surface,
  Text,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChatBubble from '@/components/ChatBubble';
import { InputToolbar } from '@/components/InputToolbar';
import { ScrollToBottomButton } from '@/components/ScrollToBottomButton';
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

const ChatRoomScreen: React.FC<RootStackScreenProps<'ChatRoom'>> = ({ route, navigation }) => {
  const { chatId, title } = route.params;
  const theme = useTheme();
  const { token, user } = useSession();
  const [draft, setDraft] = useState('');
  const [conversation, setConversation] = useState<ApiMessage[]>([]);
  const [isTyping] = useState(false); // Reserved for typing indicator
  const [showScrollButton, setShowScrollButton] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isNearBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);
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
    // loading: isPickingImage, // Reserved for future use
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

  // Scroll to bottom helper with proper timing (inverted list scrolls to index 0)
  const scrollToBottomSmooth = useCallback((animated: boolean = true) => {
    setTimeout(() => {
      if (conversation.length > 0) {
        flatListRef.current?.scrollToIndex({ index: 0, animated });
      }
    }, 100);
  }, [conversation.length]);

  // Update a message or add it to the conversation
  const upsertMessage = useCallback((incoming: ApiMessage) => {
    setConversation((prev) => {
      const index = prev.findIndex((item) => item.id === incoming.id);
      if (index >= 0) {
        // Update existing message
        const next = [...prev];
        next[index] = incoming;
        return next;
      }
      // Add new message and sort by createdAt DESCENDING (newest first)
      // This is reversed because FlatList is inverted
      const updated = [...prev, incoming];
      return updated.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, []);

  // Handle pending message update when server confirms
  const handlePendingMessageUpdate = useCallback((tempId: string, serverId: string) => {
    console.log('[ChatRoom] Updating pending message:', tempId, '->', serverId);
    setConversation((prev) =>
      prev.map((msg) => (msg.id && msg.id === tempId ? { ...msg, id: serverId } : msg))
    );
  }, []);

  const handleIncomingMessage = useCallback(
    (message: ApiMessage) => {
      console.log('[ChatRoom] Incoming message:', message.id);
      upsertMessage(message);
    },
    [upsertMessage]
  );

  const { status: socketStatus, error: socketError, sendPendingMessage } = useChatSocket(chatId, {
    enabled: Boolean(token),
    onMessage: handleIncomingMessage,
    onPendingMessageUpdate: handlePendingMessageUpdate,
  });

  const addAttachment = useCallback((attachment: MessageAttachment) => {
    setPendingAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  // Load initial messages from API
  useEffect(() => {
    if (remoteMessages) {
      console.log('[ChatRoom] Raw messages from API:', remoteMessages.length);
      remoteMessages.forEach((msg, idx) => {
        console.log(`[${idx}] ${msg.createdAt} - ${msg.content?.substring(0, 20)}`);
      });
      
      // Sort messages by createdAt DESCENDING (newest first, oldest last)
      // This is reversed because FlatList is inverted
      const sorted = [...remoteMessages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log('[ChatRoom] Sorted messages (reversed for inverted list):', sorted.length);
      sorted.forEach((msg, idx) => {
        console.log(`[${idx}] ${msg.createdAt} - ${msg.content?.substring(0, 20)}`);
      });
      
      setConversation(sorted);
      isInitialLoadRef.current = true;
    }
  }, [remoteMessages]);

  // Auto-scroll to bottom when conversation changes
  useEffect(() => {
    if (conversation.length === 0) return;

    // On initial load, scroll without animation
    if (isInitialLoadRef.current) {
      scrollToBottomSmooth(false);
      isInitialLoadRef.current = false;
      return;
    }

    // For new messages, only scroll if user is near bottom
    if (isNearBottomRef.current) {
      scrollToBottomSmooth(true);
    }
  }, [conversation, scrollToBottomSmooth]);

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

  /* Camera capture functionality - reserved for future use
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
  */

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
    if (!token || !user) {
      return;
    }

    const hasText = trimmed.length > 0;
    const hasAttachments = pendingAttachments.length > 0;

    if (!hasText && !hasAttachments) {
      return;
    }

    // If socket is disconnected or reconnecting, queue the message locally
    if (socketStatus === 'disconnected' || socketStatus === 'reconnecting' || socketStatus === 'error') {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pendingMsg: ApiMessage = {
        id: tempId,
        chatId,
        sender: user,
        content: trimmed,
        attachments: hasAttachments ? pendingAttachments : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to conversation immediately with pending status
      setConversation((prev) => {
        const updated = [...prev, pendingMsg];
        // Sort DESCENDING (newest first) because FlatList is inverted
        return updated.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      // Queue for sending when socket reconnects
      sendPendingMessage({
        tempId,
        chatId,
        content: hasText ? trimmed : undefined,
        attachments: hasAttachments ? pendingAttachments : undefined,
        createdAt: new Date().toISOString(),
      });

      setDraft('');
      setPendingAttachments([]);
      return;
    }

    // Socket is connected, send normally via REST API
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

  const scrollToBottom = useCallback(() => {
    scrollToBottomSmooth(true);
    isNearBottomRef.current = true; // Reset tracking
  }, [scrollToBottomSmooth]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    
    // For inverted FlatList, being at bottom means offsetY is close to 0
    isNearBottomRef.current = offsetY < 100;
    setShowScrollButton(offsetY > 200);
  }, []);

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

  /* Helper functions - reserved for future use
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
  */

  /* Socket status message - reserved for future use
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
  */

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
                borderColor: theme.dark ? 'rgba(255, 255, 255, 0.12)' : theme.colors.surfaceVariant,
                backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.08)' : theme.colors.secondaryContainer,
              },
            ]}
          >
            <Text variant="labelSmall" style={{ color: theme.dark ? '#5E97F6' : theme.colors.primary }}>
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

  /* Message attachment renderer - reserved for future use
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
  */

  const listFooterComponent = useMemo(() => {
    return (
      <View>
        {/* Typing Indicator */}
        {isTyping && <TypingIndicator names={['Someone']} />}

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
                    borderColor: theme.dark ? 'rgba(255, 255, 255, 0.12)' : theme.colors.outlineVariant,
                    backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
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

  // Get gradient colors for avatar based on name
  const gradientColors = useMemo(() => {
    const gradients = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#30cfd0', '#330867'],
      ['#a8edea', '#fed6e3'],
      ['#ff9a9e', '#fecfef'],
    ];
    const index = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  }, [title]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <IconButton icon="arrow-left" size={24} iconColor={theme.colors.onBackground} style={{ margin: 0 }} />
          </Pressable>
          <Avatar.Text
            size={40}
            label={title.slice(0, 2).toUpperCase()}
            style={{ backgroundColor: gradientColors[0] }}
            labelStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}
          />
          <View style={styles.headerTitleContainer}>
            <Text variant="titleMedium" style={{ color: theme.colors.onBackground, fontWeight: '700', fontSize: 18 }}>
              {title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
              {socketStatus === 'connected' ? 'online' : 'offline'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <IconButton icon="video-outline" size={24} iconColor={theme.dark ? '#5E97F6' : theme.colors.primary} style={{ margin: 0 }} />
          <IconButton icon="phone-outline" size={24} iconColor={theme.dark ? '#66BB6A' : theme.colors.primary} style={{ margin: 0 }} />
          <IconButton icon="dots-vertical" size={24} iconColor={theme.colors.onBackground} style={{ margin: 0 }} />
        </View>
      </View>

      {/* Reconnection status banner */}
      {(socketStatus === 'reconnecting' || socketStatus === 'disconnected' || socketStatus === 'error') && (
        <View style={[styles.reconnectionBanner, { backgroundColor: theme.dark ? 'rgba(239, 83, 80, 0.15)' : theme.colors.errorContainer }]}>
          <ActivityIndicator size="small" color={theme.dark ? '#EF5350' : theme.colors.error} />
          <Text style={[styles.reconnectionText, { color: theme.dark ? '#EF5350' : theme.colors.error }]}>
            {socketStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected. Retrying...'}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={conversation}
          keyExtractor={(item, index) => item.id || `message-${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={listEmptyComponent}
          ListHeaderComponent={listFooterComponent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          inverted={true}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          renderItem={({ item, index }) => {
            const senderId =
              typeof item.sender === 'string'
                ? item.sender
                : item.sender?.id || (item.sender as any)?._id?.toString();

            const isSentByMe = senderId === user?.id;
            const isPending = item.id?.startsWith('temp_') ?? false;
            const senderName =
              !isSentByMe && typeof item.sender === 'object' ? item.sender.name : undefined;

            return (
              <ChatBubble
                message={item}
                isMine={isSentByMe}
                isPending={isPending}
                senderName={senderName}
                index={index}
                onLongPress={() => {
                  // TODO: Show context menu for copy/delete/react
                }}
              />
            );
          }}
        />

        {/* Scroll to bottom button */}
        <ScrollToBottomButton visible={showScrollButton} onPress={scrollToBottom} />

        {/* Input toolbar */}
        <InputToolbar
          draft={draft}
          onChangeDraft={handleDraftChange}
          onSend={handleSend}
          isLoading={isSending}
          pendingAttachments={pendingAttachments}
          onRemoveAttachment={(index) => {
            setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
          }}
          onPickImage={handleSelectImageFromLibrary}
          onRecordAudio={handleToggleRecording}
          isRecording={isRecording}
          isStoppingRecording={isStoppingRecording}
          disabled={!token}
        />

        {/* Error messages */}
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
        {sendError && (
          <HelperText type="error" visible={Boolean(sendError)}>
            {sendError.message}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reconnectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  reconnectionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 16,
    paddingTop: 8,
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
