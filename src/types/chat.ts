/** Conversa privada com exatamente dois participantes. */
export type Conversation = {
  id: string;
  /** Tupla fixa: uma conversa nunca tem mais nem menos que dois participantes. */
  participants: [string, string];
  createdAt: number;
};

/** Mensagem trocada dentro de uma conversa. */
export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: number;
};

/** Payload gravado em `messages/{conversationId}/{messageId}`. */
export type ChatMessageRecord = ChatMessage;

/** Payload gravado em `conversations/{conversationId}`. */
export type ConversationRecord = Conversation;

/** Dados necessarios para enviar uma nova mensagem. */
export type NewMessageInput = {
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
};
