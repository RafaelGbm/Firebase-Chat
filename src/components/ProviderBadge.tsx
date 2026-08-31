import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PROVIDER_SHORT_LABELS, type AuthProvider } from '../types/user';
import { providerColors, radii, spacing, typography } from '../theme/theme';

type ProviderBadgeProps = {
  provider: AuthProvider;
};

/** Selo que identifica a forma de autenticacao usada por um usuario. */
export function ProviderBadge({ provider }: ProviderBadgeProps): React.JSX.Element {
  const accent = providerColors[provider];

  return (
    <View style={[styles.container, { borderColor: accent }]}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={[styles.text, { color: accent }]}>{PROVIDER_SHORT_LABELS[provider]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
  },
  text: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
