import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ChatMessage as ChatMessageModel } from '../types/chat';
import { colors, radii, spacing, typography } from '../theme/theme';

type ChatMessageProps = {
  message: ChatMessageModel;
  /** `true` quando a mensagem foi enviada pelo usuario autenticado. */
  isOwn: boolean;
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Balao de mensagem, com diferenciacao visual entre enviada e recebida. */
export function ChatMessage({ message, isOwn }: ChatMessageProps): React.JSX.Element {
  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={styles.text}>{message.text}</Text>
        <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  bubbleOwn: {
    backgroundColor: colors.bubbleOwn,
    borderBottomRightRadius: radii.sm,
  },
  bubbleOther: {
    backgroundColor: colors.bubbleOther,
    borderBottomLeftRadius: radii.sm,
  },
  text: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 21,
  },
  time: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: '#DBE5FF',
  },
  timeOther: {
    color: colors.textMuted,
  },
});
