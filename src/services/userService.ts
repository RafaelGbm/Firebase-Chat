import {
  equalTo,
  get,
  onValue,
  orderByChild,
  query,
  ref,
  update,
  type DataSnapshot,
  type Unsubscribe,
} from 'firebase/database';

import { isAuthProvider, type AuthProvider, type ChatUser, type ChatUserRecord } from '../types/user';
import { getAllowedProviders } from '../utils/chatRules';
import { DB_PATHS, database } from './firebase';

/**
 * Converte um no cru do Realtime Database em `ChatUser`, descartando registros
 * malformados. Trabalha sobre `unknown` para nao precisar de `any`.
 */
export function parseChatUser(uid: string, value: unknown): ChatUser | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Partial<Record<keyof ChatUserRecord, unknown>>;

  if (typeof record.name !== 'string' || !isAuthProvider(record.provider)) {
    return null;
  }

  return {
    uid,
    name: record.name,
    email: typeof record.email === 'string' ? record.email : null,
    provider: record.provider,
  };
}

function collectUsers(snapshot: DataSnapshot): ChatUser[] {
  const users: ChatUser[] = [];

  snapshot.forEach((child) => {
    const parsed = parseChatUser(child.key ?? '', child.val());
    if (parsed) {
      users.push(parsed);
    }
  });

  return users;
}

/**
 * Cria ou atualiza o perfil publico do usuario em `users/{uid}`.
 * Usa `update` para nao sobrescrever o `createdAt` de perfis ja existentes.
 */
export async function saveUserProfile(user: ChatUser): Promise<void> {
  const userRef = ref(database, DB_PATHS.user(user.uid));
  const snapshot = await get(userRef);
  const now = Date.now();

  const payload: ChatUserRecord = {
    uid: user.uid,
    name: user.name,
    email: user.email,
    provider: user.provider,
    createdAt: snapshot.exists() && typeof snapshot.child('createdAt').val() === 'number'
      ? (snapshot.child('createdAt').val() as number)
      : now,
    updatedAt: now,
  };

  await update(userRef, payload);
}

/** Le um perfil especifico (usado ao abrir uma conversa por deep link). */
export async function fetchUserProfile(uid: string): Promise<ChatUser | null> {
  const snapshot = await get(ref(database, DB_PATHS.user(uid)));
  return snapshot.exists() ? parseChatUser(uid, snapshot.val()) : null;
}

/**
 * Escuta, em tempo real, apenas os usuarios compativeis com a regra entre
 * provedores. Um usuario `password` gera duas queries (google + apple); um
 * usuario `google` ou `apple` gera uma unica query (`password`).
 *
 * Retorna a funcao de cleanup que remove TODOS os listeners criados.
 */
export function subscribeToCompatibleUsers(
  currentUser: ChatUser,
  onUsers: (users: ChatUser[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const allowedProviders: AuthProvider[] = getAllowedProviders(currentUser.provider);
  const byProvider = new Map<AuthProvider, ChatUser[]>();
  const unsubscribers: Unsubscribe[] = [];

  const emit = (): void => {
    const merged = allowedProviders
      .flatMap((provider) => byProvider.get(provider) ?? [])
      .filter((candidate) => candidate.uid !== currentUser.uid)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    onUsers(merged);
  };

  for (const provider of allowedProviders) {
    const usersQuery = query(
      ref(database, DB_PATHS.users),
      orderByChild('provider'),
      equalTo(provider),
    );

    unsubscribers.push(
      onValue(
        usersQuery,
        (snapshot) => {
          byProvider.set(provider, collectUsers(snapshot));
          emit();
        },
        onError,
      ),
    );
  }

  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}

