import { useCallback, useEffect, useMemo, useState } from 'react';

import { sendMessage as sendMessageService, subscribeToMessages } from '../services/chatService';
import type { ChatMessage } from '../types/chat';
import type { ChatUser } from '../types/user';
import { translateError } from '../utils/errors';

export type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  /** `true` quando a conversa ainda nao possui mensagens. */
  isEmpty: boolean;
  clearError: () => void;
  sendMessage: (text: string) => Promise<boolean>;
};

/** Insere a mensagem mantendo a ordem cronologica e sem duplicatas. */
function insertMessage(previous: ChatMessage[], message: ChatMessage): ChatMessage[] {
  if (previous.some((existing) => existing.id === message.id)) {
    return previous;
  }

  const last = previous[previous.length - 1];

  // Caso comum: a mensagem nova e a mais recente.
  if (!last || last.createdAt <= message.createdAt) {
    return [...previous, message];
  }

  return [...previous, message].sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Estado completo de uma conversa 1 para 1: carrega o historico, mantem o
 * listener em tempo real e expoe o envio de mensagens.
 */
export function useChat(
  conversationId: string,
  currentUser: ChatUser,
  contact: ChatUser,
): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToMessages(conversationId, {
      onMessage: (message) => {
        // Atualizacao imutavel: nunca alteramos o array anterior.
        setMessages((previous) => insertMessage(previous, message));
      },
      onReady: () => {
        setLoading(false);
      },
      onError: (subscriptionError) => {
        setError(translateError(subscriptionError, 'Nao foi possivel carregar as mensagens.'));
        setLoading(false);
      },
    });

    // Listener removido ao sair do chat ou ao trocar de conversa.
    return unsubscribe;
  }, [conversationId]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();

      if (trimmed.length === 0) {
        return false;
      }

      setSending(true);
      setError(null);

      try {
        await sendMessageService({
          conversationId,
          senderId: currentUser.uid,
          receiverId: contact.uid,
          text: trimmed,
        });

        // A mensagem chega de volta pelo listener em tempo real, o que mantem
        // uma unica fonte da verdade: o Realtime Database.
        return true;
      } catch (sendError: unknown) {
        setError(translateError(sendError, 'Nao foi possivel enviar a mensagem.'));
        return false;
      } finally {
        setSending(false);
      }
    },
    [contact.uid, conversationId, currentUser.uid],
  );

  const isEmpty = useMemo<boolean>(
    () => !loading && messages.length === 0,
    [loading, messages.length],
  );

  return { messages, loading, sending, error, isEmpty, clearError, sendMessage };
}
