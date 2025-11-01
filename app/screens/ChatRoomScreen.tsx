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
  Dialog,
  IconButton,
  Menu,
  Portal,
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
import { borderRadius, spacing } from '@/theme';
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
  const [isTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [clearChatDialogVisible, setClearChatDialogVisible] = useState(false);
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

  // Handle incoming message - WhatsApp style (immediate update)
  const handleIncomingMessage = useCallback(
    (message: ApiMessage) => {
      upsertMessage(message);
      // Auto-scroll if user is near bottom
      if (isNearBottomRef.current) {
        setTimeout(() => scrollToBottomSmooth(true), 100);
      }
    },
    [upsertMessage]
  );

  const { status: socketStatus, sendPendingMessage } = useChatSocket(chatId, {
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
      const sorted = [...remoteMessages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
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

  // WhatsApp-style send: Optimistic update with pending state
  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!token || !user) return;

    const hasText = trimmed.length > 0;
    const hasAttachments = pendingAttachments.length > 0;
    if (!hasText && !hasAttachments) return;

    // Generate temp ID for optimistic update
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

    // Clear input immediately (WhatsApp behavior)
    setDraft('');
    setPendingAttachments([]);

    // Add to conversation immediately with pending status
    setConversation((prev) => {
      const updated = [pendingMsg, ...prev];
      return updated.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    // Scroll to show new message
    setTimeout(() => scrollToBottomSmooth(true), 100);

    // Send via socket if connected, otherwise queue
    if (socketStatus === 'connected') {
      sendPendingMessage({
        tempId,
        chatId,
        content: hasText ? trimmed : undefined,
        attachments: hasAttachments ? pendingAttachments : undefined,
        createdAt: new Date().toISOString(),
      });
    }

    // Also send via REST API for reliability
    try {
      const message = await sendMessage({
        chatId,
        content: hasText ? trimmed : undefined,
        attachments: hasAttachments ? pendingAttachments : undefined,
      });
      
      // Update the pending message with server response
      setConversation((prev) =>
        prev.map((msg) => (msg.id === tempId ? message : msg))
      );
    } catch (error) {
      // Mark message as failed
      setConversation((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, id: `failed_${tempId}` } : msg
        )
      );
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
    if (sendError) resetSendError();
    setDraft(value);
  };

  const handleClearChat = () => {
    setConversation([]);
    setClearChatDialogVisible(false);
    // Optionally call API to clear chat history on server
  };

  const gradientColors = useMemo(() => {
    const gradients = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
    ];
    const index = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  }, [title]);

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.dark ? '#0A0E1A' : '#F0F2F5' }]}
      edges={['top']}
    >
      {/* WhatsApp-style Header */}
      <View style={[styles.header, { backgroundColor: theme.dark ? '#1C1F2E' : '#FFFFFF' }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginRight: spacing.xs }]}
          >
            <IconButton icon="arrow-left" size={24} iconColor={theme.colors.onBackground} style={{ margin: 0 }} />
          </Pressable>
          <Avatar.Text
            size={42}
            label={title.slice(0, 2).toUpperCase()}
            style={{ backgroundColor: gradientColors[0], marginRight: spacing.sm }}
            labelStyle={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}
          />
          <View style={styles.headerTitleContainer}>
            <Text variant="titleMedium" style={{ color: theme.colors.onBackground, fontWeight: '700', fontSize: 17 }}>
              {title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>
              {socketStatus === 'connected' ? 'online' : 'tap here for contact info'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={24}
                iconColor={theme.colors.onBackground}
                onPress={() => setMenuVisible(true)}
                style={{ margin: 0 }}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setClearChatDialogVisible(true);
              }}
              title="Clear chat"
              leadingIcon="delete-outline"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                // Add more options here
              }}
              title="Mute notifications"
              leadingIcon="bell-off-outline"
            />
          </Menu>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={conversation}
          keyExtractor={(item, index) => item.id || `message-${index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: spacing.lg }
          ]}
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

        <ScrollToBottomButton visible={showScrollButton} onPress={scrollToBottom} />

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

        {/* Error messages - only show critical ones */}
        {sendError && (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={{ color: theme.colors.error, fontSize: 13 }}>
              Message failed to send. Tap to retry.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Clear Chat Dialog */}
      <Portal>
        <Dialog visible={clearChatDialogVisible} onDismiss={() => setClearChatDialogVisible(false)}>
          <Dialog.Title>Clear chat?</Dialog.Title>
          <Dialog.Content>
            <Text>This will clear all messages from this conversation. This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearChatDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleClearChat} textColor={theme.colors.error}>Clear</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
  },
  emptyStateSurface: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  pendingAttachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pendingAttachmentCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    position: 'relative',
    justifyContent: 'center',
  },
  pendingImageAttachment: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.sm,
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  audioAttachment: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    minWidth: 140,
    alignItems: 'flex-start',
  },
  errorBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
});
