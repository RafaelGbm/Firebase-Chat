import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChatUser } from '../types/user';
import { colors, radii, spacing, typography } from '../theme/theme';
import { ProviderBadge } from './ProviderBadge';

type UserItemProps = {
  user: ChatUser;
  onPress: (user: ChatUser) => void;
  disabled?: boolean;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join('');
  return initials.length > 0 ? initials : '?';
}

/** Linha da lista de contatos compativeis. */
export function UserItem({ user, onPress, disabled = false }: UserItemProps): React.JSX.Element {
  const handlePress = useCallback((): void => {
    onPress(user);
  }, [onPress, user]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Conversar com ${user.name}`}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {user.name}
        </Text>

        {user.email ? (
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        ) : null}

        <ProviderBadge provider={user.provider} />
      </View>

      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  email: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
});
