import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../theme/theme';

type ErrorMessageProps = {
  /** Quando `null` ou vazio o componente nao renderiza nada. */
  message: string | null;
  /** Rotulo da acao secundaria (ex.: "Tentar novamente"). */
  actionLabel?: string;
  onAction?: () => void;
};

/** Bloco padrao de feedback de erro. */
export function ErrorMessage({
  message,
  actionLabel,
  onAction,
}: ErrorMessageProps): React.JSX.Element | null {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.message}>{message}</Text>

      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  message: {
    color: colors.danger,
    fontSize: typography.body,
    lineHeight: 20,
  },
  action: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
