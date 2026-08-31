import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme/theme';

type LoadingProps = {
  /** Texto opcional exibido abaixo do indicador. */
  message?: string;
  /** Ocupa a tela inteira quando `true`. */
  fullscreen?: boolean;
};

/** Indicador de carregamento reutilizado por todas as telas. */
export function Loading({ message, fullscreen = false }: LoadingProps): React.JSX.Element {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  message: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center',
  },
});
