import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { Platform } from 'react-native';

import { getFirebaseOptions } from '../config/firebaseConfig';

/** Inicializa o app apenas uma vez, mesmo com Fast Refresh ativo. */
function resolveApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(getFirebaseOptions());
}

/**
 * No React Native nao existe `localStorage`, entao a sessao e persistida no
 * AsyncStorage. Na web o SDK ja resolve a persistencia sozinho.
 */
function resolveAuth(firebaseApp: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // `initializeAuth` lanca se o Auth ja tiver sido criado (Fast Refresh).
    return getAuth(firebaseApp);
  }
}

export const app: FirebaseApp = resolveApp();
export const auth: Auth = resolveAuth(app);
export const database: Database = getDatabase(app);

/** Caminhos usados no Realtime Database, centralizados para evitar strings soltas. */
export const DB_PATHS = {
  users: 'users',
  user: (uid: string): string => `users/${uid}`,
  conversations: 'conversations',
  conversation: (conversationId: string): string => `conversations/${conversationId}`,
  messages: (conversationId: string): string => `messages/${conversationId}`,
} as const;
