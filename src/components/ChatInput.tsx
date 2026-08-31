import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '../theme/theme';

type ChatInputProps = {
  onSend: (text: string) => Promise<boolean>;
  sending: boolean;
  disabled?: boolean;
};

const MAX_MESSAGE_LENGTH = 1000;

/** Campo de digitacao e botao de envio da conversa. */
export function ChatInput({ onSend, sending, disabled = false }: ChatInputProps): React.JSX.Element {
  const [text, setText] = useState<string>('');

  const canSend = text.trim().length > 0 && !sending && !disabled;

  const handleSend = useCallback(async (): Promise<void> => {
    if (!canSend) {
      return;
    }

    const delivered = await onSend(text);

    // O campo so e limpo quando o Realtime Database confirma a gravacao.
    if (delivered) {
      setText('');
    }
  }, [canSend, onSend, text]);

  const handlePress = useCallback((): void => {
    void handleSend();
  }, [handleSend]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Digite uma mensagem"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={MAX_MESSAGE_LENGTH}
        editable={!disabled}
      />

      <Pressable
        onPress={handlePress}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Enviar mensagem"
        style={({ pressed }) => [
          styles.sendButton,
          !canSend ? styles.sendButtonDisabled : null,
          pressed && canSend ? styles.sendButtonPressed : null,
        ]}
      >
        {sending ? (
          <ActivityIndicator color={colors.text} size="small" />
        ) : (
          <Text style={styles.sendLabel}>Enviar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
  },
  sendButton: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  sendLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
