import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View, type ListRenderItemInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProviderBadge } from '../components/ProviderBadge';
import { UserItem } from '../components/UserItem';
import { useAuth } from '../hooks/useAuth';
import { useContacts } from '../hooks/useContacts';
import { ensureConversation } from '../services/chatService';
import type { RootStackParamList } from '../types/navigation';
import type { ChatUser } from '../types/user';
import { colors, radii, spacing, typography } from '../theme/theme';
import { translateError } from '../utils/errors';

type UsersScreenProps = NativeStackScreenProps<RootStackParamList, 'Users'>;

/** Lista somente os contatos compativeis com a regra entre provedores. */
export function UsersScreen({ navigation }: UsersScreenProps): React.JSX.Element {
  const { user, signOut, pending } = useAuth();
  const { contacts, loading, error, allowedProvidersLabel, isEmpty, retry } = useContacts(user);

  const [openingUid, setOpeningUid] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const handleSelectUser = useCallback(
    async (contact: ChatUser): Promise<void> => {
      if (!user) {
        return;
      }

      setOpenError(null);
      setOpeningUid(contact.uid);

      try {
        // Localiza a conversa existente ou cria uma nova com exatamente 2 pessoas.
        const conversation = await ensureConversation(user, contact);
        navigation.navigate('Chat', { conversationId: conversation.id, contact });
      } catch (conversationError: unknown) {
        setOpenError(translateError(conversationError, 'Nao foi possivel abrir a conversa.'));
      } finally {
        setOpeningUid(null);
      }
    },
    [navigation, user],
  );

  const handlePressUser = useCallback(
    (contact: ChatUser): void => {
      void handleSelectUser(contact);
    },
    [handleSelectUser],
  );

  const handleSignOut = useCallback((): void => {
    void signOut();
  }, [signOut]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatUser>): React.JSX.Element => (
      <UserItem user={item} onPress={handlePressUser} disabled={openingUid !== null} />
    ),
    [handlePressUser, openingUid],
  );

  const keyExtractor = useCallback((item: ChatUser): string => item.uid, []);

  const headerSubtitle = useMemo<string>(
    () => (allowedProvidersLabel ? `Voce pode conversar com: ${allowedProvidersLabel}` : ''),
    [allowedProvidersLabel],
  );

  if (!user) {
    // Estado defensivo: a navegacao so monta esta tela com sessao ativa.
    return <Loading fullscreen message="Carregando sua sessao..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting} numberOfLines={1}>
            Ola, {user.name}
          </Text>
          {user.email ? (
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
          <ProviderBadge provider={user.provider} />
        </View>

        <PrimaryButton
          label="Sair"
          variant="secondary"
          onPress={handleSignOut}
          loading={pending}
          disabled={pending}
          style={styles.signOutButton}
        />
      </View>

      <View style={styles.ruleBanner}>
        <Text style={styles.ruleText}>{headerSubtitle}</Text>
      </View>

      <View style={styles.body}>
        <ErrorMessage message={error ?? openError} actionLabel="Tentar novamente" onAction={retry} />

        {loading ? (
          <Loading message="Buscando contatos compativeis..." />
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={
              isEmpty ? styles.listContentEmpty : styles.listContent
            }
            ItemSeparatorComponent={ListSeparator}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon="👥"
                title="Nenhum contato disponivel"
                description={
                  `Ainda nao ha ninguem autenticado com ${allowedProvidersLabel}. ` +
                  'Peca para alguem entrar com um provedor compativel e a lista atualiza sozinha.'
                }
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function ListSeparator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  greeting: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  email: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  signOutButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  ruleBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  ruleText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: spacing.sm,
  },
});
