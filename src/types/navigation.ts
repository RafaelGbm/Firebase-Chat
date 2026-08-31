import type { ChatUser } from './user';

/** Rotas do stack principal e os parametros aceitos por cada uma. */
export type RootStackParamList = {
  Login: undefined;
  VerifyEmail: undefined;
  Users: undefined;
  Chat: {
    conversationId: string;
    contact: ChatUser;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
