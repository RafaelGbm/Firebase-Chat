import {
  get,
  limitToLast,
  onChildAdded,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  set,
  type DataSnapshot,
  type Query,
  type Unsubscribe,
} from 'firebase/database';

import type { ChatMessage, Conversation, NewMessageInput } from '../types/chat';
import type { ChatUser } from '../types/user';
import { assertCanUsersChat, buildConversationId, buildParticipants } from '../utils/chatRules';
import { DB_PATHS, database } from './firebase';

/** Quantidade maxima de mensagens mantidas em memoria por conversa. */
export const MESSAGES_PAGE_SIZE = 200;

export type MessageSubscriptionHandlers = {
  /** Disparado para cada mensagem existente e para cada nova mensagem. */
  onMessage: (message: ChatMessage) => void;
  /** Disparado uma unica vez, quando a carga inicial termina. */
  onReady: () => void;
  onError: (error: Error) => void;
};

/** Valida e converte um no de `messages/{conversationId}` em `ChatMessage`. */
export function parseChatMessage(
  conversationId: string,
  messageId: string,
  value: unknown,
): ChatMessage | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Partial<Record<keyof ChatMessage, unknown>>;

  if (
    typeof record.senderId !== 'string' ||
    typeof record.receiverId !== 'string' ||
    typeof record.text !== 'string' ||
    typeof record.createdAt !== 'number'
  ) {
    return null;
  }

  return {
    id: messageId,
    conversationId,
    senderId: record.senderId,
    receiverId: record.receiverId,
    text: record.text,
    createdAt: record.createdAt,
  };
}

function parseConversation(conversationId: string, value: unknown): Conversation | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Partial<Record<keyof Conversation, unknown>>;
  const participants = record.participants;

  if (
    !Array.isArray(participants) ||
    participants.length !== 2 ||
    typeof participants[0] !== 'string' ||
    typeof participants[1] !== 'string' ||
    typeof record.createdAt !== 'number'
  ) {
    return null;
  }

  return {
    id: conversationId,
    participants: [participants[0], participants[1]],
    createdAt: record.createdAt,
  };
}

function buildMessagesQuery(conversationId: string): Query {
  return query(
    ref(database, DB_PATHS.messages(conversationId)),
    orderByChild('createdAt'),
    limitToLast(MESSAGES_PAGE_SIZE),
  );
}

/**
 * Localiza a conversa entre os dois usuarios ou cria uma nova.
 * O id e deterministico (uids ordenados), o que garante que os dois lados
 * cheguem sempre na mesma conversa e que ela tenha exatamente 2 participantes.
 */
export async function ensureConversation(
  currentUser: ChatUser,
  contact: ChatUser,
): Promise<Conversation> {
  assertCanUsersChat(currentUser, contact);

  const conversationId = buildConversationId(currentUser.uid, contact.uid);
  const conversationRef = ref(database, DB_PATHS.conversation(conversationId));
  const snapshot: DataSnapshot = await get(conversationRef);

  const existing = snapshot.exists() ? parseConversation(conversationId, snapshot.val()) : null;
  if (existing) {
    return existing;
  }

  const conversation: Conversation = {
    id: conversationId,
    participants: buildParticipants(currentUser.uid, contact.uid),
    createdAt: Date.now(),
  };

  try {
    await set(conversationRef, conversation);
    return conversation;
  } catch (writeError: unknown) {
    // Os dois lados podem tentar criar a mesma conversa ao mesmo tempo; as
    // regras so permitem a primeira escrita. Se o outro lado ganhou a corrida,
    // basta reaproveitar a conversa que ja existe.
    const retry = await get(conversationRef);
    const created = retry.exists() ? parseConversation(conversationId, retry.val()) : null;

    if (created) {
      return created;
    }

    throw writeError;
  }
}

/** Grava uma nova mensagem no Realtime Database. */
export async function sendMessage({
  conversationId,
  senderId,
  receiverId,
  text,
}: NewMessageInput): Promise<ChatMessage> {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    throw new Error('Digite uma mensagem antes de enviar.');
  }

  const messageRef = push(ref(database, DB_PATHS.messages(conversationId)));
  const messageId = messageRef.key;

  if (!messageId) {
    throw new Error('Nao foi possivel gerar o identificador da mensagem.');
  }

  const message: ChatMessage = {
    id: messageId,
    conversationId,
    senderId,
    receiverId,
    text: trimmed,
    createdAt: Date.now(),
  };

  await set(messageRef, message);
  return message;
}

/**
 * Escuta as mensagens da conversa em tempo real.
 *
 * `onChildAdded` entrega as mensagens ja existentes e, depois, cada mensagem
 * nova assim que ela chega no Realtime Database -- sem refresh manual.
 * O `onValue` com `onlyOnce` serve apenas para saber quando a carga inicial
 * terminou: o Firebase garante que o evento `value` so e emitido depois de
 * todos os `child_added` iniciais da mesma query.
 *
 * A funcao retornada remove os dois listeners.
 */
export function subscribeToMessages(
  conversationId: string,
  handlers: MessageSubscriptionHandlers,
): Unsubscribe {
  const messagesQuery = buildMessagesQuery(conversationId);

  const unsubscribeAdded = onChildAdded(
    messagesQuery,
    (snapshot) => {
      const message = parseChatMessage(conversationId, snapshot.key ?? '', snapshot.val());
      if (message) {
        handlers.onMessage(message);
      }
    },
    handlers.onError,
  );

  const unsubscribeReady = onValue(
    messagesQuery,
    () => handlers.onReady(),
    handlers.onError,
    { onlyOnce: true },
  );

  return () => {
    unsubscribeAdded();
    unsubscribeReady();
  };
}
