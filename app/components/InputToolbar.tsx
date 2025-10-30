import React from 'react';
import {
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View
} from 'react-native';
import { ActivityIndicator, IconButton, Surface, Text, TextInput, useTheme } from 'react-native-paper';

import type { MessageAttachment } from '@/lib/api/types';
import { borderRadius, chatColors, shadows, spacing } from '@/theme';

interface InputToolbarProps {
  draft: string;
  onChangeDraft: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  pendingAttachments?: MessageAttachment[];
  onRemoveAttachment?: (index: number) => void;
  onPickImage?: () => void;
  onRecordAudio?: () => void;
  isRecording?: boolean;
  isStoppingRecording?: boolean;
  disabled?: boolean;
}

export const InputToolbar: React.FC<InputToolbarProps> = ({
  draft,
  onChangeDraft,
  onSend,
  isLoading = false,
  pendingAttachments = [],
  onRemoveAttachment,
  onPickImage,
  onRecordAudio,
  isRecording = false,
  isStoppingRecording = false,
  disabled = false,
}) => {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const colors = theme.dark ? chatColors.dark : chatColors.light;

  const canSend = draft.trim().length > 0 || pendingAttachments.length > 0;
  const isSmallScreen = screenWidth < 375;

  return (
    <View style={styles.container}>
      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <View style={styles.attachmentsPreview}>
          {pendingAttachments.map((attachment, index) => (
            <Surface
              key={`pending-${index}`}
              elevation={1}
              style={[
                styles.attachmentCard,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.borderColor,
                },
              ]}
            >
              {attachment.kind === 'image' && (
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  📷 Image
                </Text>
              )}
              {attachment.kind === 'audio' && (
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  🎵 Audio
                </Text>
              )}
              {onRemoveAttachment && (
                <Pressable
                  onPress={() => onRemoveAttachment(index)}
                  style={styles.removeButton}
                  hitSlop={8}
                >
                  <Text style={{ color: theme.colors.error, fontSize: 16 }}>×</Text>
                </Pressable>
              )}
            </Surface>
          ))}
        </View>
      )}

      {/* Input area */}
      <Surface
        elevation={3}
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.borderColor,
          },
          shadows.lg,
        ]}
      >
        {/* Media actions */}
        <View style={styles.mediaActions}>
          {onPickImage && (
            <IconButton
              icon="image-outline"
              size={isSmallScreen ? 20 : 22}
              onPress={onPickImage}
              accessibilityLabel="Attach image"
              disabled={disabled}
              iconColor={colors.accent}
            />
          )}
          {onRecordAudio && (
            <IconButton
              icon={isRecording ? 'microphone-off' : 'microphone-outline'}
              size={isSmallScreen ? 20 : 22}
              onPress={onRecordAudio}
              accessibilityLabel={isRecording ? 'Stop recording' : 'Record audio'}
              disabled={disabled && !isRecording}
              iconColor={isRecording ? theme.colors.error : colors.accent}
              loading={isStoppingRecording}
            />
          )}
        </View>

        {/* Text input */}
        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          placeholder="Message"
          placeholderTextColor={colors.textSecondary}
          multiline
          mode="flat"
          style={[
            styles.textInput,
            {
              color: colors.textPrimary,
              backgroundColor: 'transparent',
            },
          ]}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          editable={!disabled}
          maxLength={1000}
        />

        {/* Send button */}
        {isLoading ? (
          <View style={styles.sendButton}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : (
          <Pressable
            onPress={onSend}
            disabled={!canSend || disabled}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: canSend ? theme.colors.primary : colors.borderColor,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <IconButton
              icon="send"
              size={20}
              iconColor={canSend ? theme.colors.onPrimary : colors.textSecondary}
              style={{ margin: 0 }}
            />
          </Pressable>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xs,
  },
  attachmentsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  removeButton: {
    marginLeft: spacing.xs,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    fontSize: 15,
    paddingHorizontal: spacing.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InputToolbar;
