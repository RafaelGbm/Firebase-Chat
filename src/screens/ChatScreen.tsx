import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatInput } from '../components/ChatInput';
import { ChatMessage } from '../components/ChatMessage';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { ProviderBadge } from '../components/ProviderBadge';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import type { ChatMessage as ChatMessageModel } from '../types/chat';
import type { RootStackParamList } from '../types/navigation';
import type { ChatUser } from '../types/user';
import { colors, spacing, typography } from '../theme/theme';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

/** Conversa 1 para 1 com atualizacao em tempo real. */
export function ChatScreen({ route, navigation }: ChatScreenProps): React.JSX.Element {
  const { conversationId, contact } = route.params;
  const { user } = useAuth();

  if (!user) {
    // Sessao encerrada enquanto o chat estava aberto.
    return <Loading fullscreen message="Encerrando sessao..." />;
  }

  return (
    <ChatScreenContent
      conversationId={conversationId}
      contact={contact}
      currentUser={user}
      navigation={navigation}
    />
  );
}

type ChatScreenContentProps = {
  conversationId: string;
  contact: ChatUser;
  currentUser: ChatUser;
  navigation: ChatScreenProps['navigation'];
};

/**
 * Componente interno para que os hooks do chat sempre rodem com um usuario
 * autenticado valido, sem chamadas condicionais de hooks.
 */
function ChatScreenContent({
  conversationId,
  contact,
  currentUser,
  navigation,
}: ChatScreenContentProps): React.JSX.Element {
  const listRef = useRef<FlatList<ChatMessageModel>>(null);
  const { messages, loading, sending, error, isEmpty, clearError, sendMessage } = useChat(
    conversationId,
    currentUser,
    contact,
  );

  // Nome do participante no cabecalho da navegacao.
  useEffect(() => {
    navigation.setOptions({ title: contact.name });
  }, [contact.name, navigation]);

  const scrollToEnd = useCallback((): void => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessageModel>): React.JSX.Element => (
      <ChatMessage message={item} isOwn={item.senderId === currentUser.uid} />
    ),
    [currentUser.uid],
  );

  const keyExtractor = useCallback((item: ChatMessageModel): string => item.id, []);

  const messageCountLabel = useMemo<string>(
    () => (messages.length === 1 ? '1 mensagem' : `${messages.length} mensagens`),
    [messages.length],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {contact.name}
            </Text>
            <Text style={styles.headerMeta}>{messageCountLabel}</Text>
          </View>
          <ProviderBadge provider={contact.provider} />
        </View>

        {error ? (
          <View style={styles.errorWrapper}>
            <ErrorMessage message={error} actionLabel="Dispensar" onAction={clearError} />
          </View>
        ) : null}

        {loading ? (
          <Loading message="Carregando mensagens..." />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={isEmpty ? styles.listContentEmpty : styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
            onLayout={scrollToEnd}
            ListEmptyComponent={
              <EmptyState
                title="Nenhuma mensagem ainda"
                description={`Envie a primeira mensagem para ${contact.name}.`}
              />
            }
          />
        )}

        <ChatInput onSend={sendMessage} sending={sending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  headerMeta: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  errorWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  listContent: {
    padding: spacing.lg,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
});
