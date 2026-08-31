import { useCallback, useEffect, useMemo, useState } from 'react';

import { subscribeToCompatibleUsers } from '../services/userService';
import type { ChatUser } from '../types/user';
import { canUsersChat, describeAllowedProviders } from '../utils/chatRules';
import { translateError } from '../utils/errors';

export type ContactsState = {
  contacts: ChatUser[];
  loading: boolean;
  error: string | null;
  /** Texto explicando com quem o usuario atual pode conversar. */
  allowedProvidersLabel: string;
  isEmpty: boolean;
  retry: () => void;
};

/**
 * Escuta em tempo real os contatos compativeis com a regra entre provedores.
 * A consulta ja e filtrada no Realtime Database (`orderByChild('provider')`) e
 * o resultado passa por uma segunda checagem local antes de chegar na tela.
 */
export function useContacts(currentUser: ChatUser | null): ContactsState {
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  useEffect(() => {
    if (!currentUser) {
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToCompatibleUsers(
      currentUser,
      (users) => {
        setContacts(users);
        setLoading(false);
      },
      (subscriptionError) => {
        setError(translateError(subscriptionError, 'Nao foi possivel carregar os contatos.'));
        setLoading(false);
      },
    );

    // Remove os listeners do Realtime Database ao sair da tela ou trocar de usuario.
    return unsubscribe;
  }, [currentUser, reloadToken]);

  // Reforca a regra no cliente, mesmo com o filtro ja aplicado na query.
  const visibleContacts = useMemo<ChatUser[]>(() => {
    if (!currentUser) {
      return [];
    }

    return contacts.filter((contact) => canUsersChat(currentUser, contact));
  }, [contacts, currentUser]);

  const allowedProvidersLabel = useMemo<string>(
    () => (currentUser ? describeAllowedProviders(currentUser.provider) : ''),
    [currentUser],
  );

  const retry = useCallback((): void => {
    setReloadToken((previous) => previous + 1);
  }, []);

  return {
    contacts: visibleContacts,
    loading,
    error,
    allowedProvidersLabel,
    isEmpty: !loading && error === null && visibleContacts.length === 0,
    retry,
  };
}
