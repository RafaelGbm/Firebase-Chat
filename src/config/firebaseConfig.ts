import type { FirebaseOptions } from 'firebase/app';
import { Platform } from 'react-native';

import { ConfigurationError } from '../utils/errors';

type RequiredEnvKey =
  | 'EXPO_PUBLIC_FIREBASE_API_KEY'
  | 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'
  | 'EXPO_PUBLIC_FIREBASE_DATABASE_URL'
  | 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'
  | 'EXPO_PUBLIC_FIREBASE_APP_ID';

const REQUIRED_ENV_KEYS: readonly RequiredEnvKey[] = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_DATABASE_URL',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

/**
 * As variaveis `EXPO_PUBLIC_*` sao substituidas pelo Metro em tempo de build,
 * por isso precisam ser lidas de forma estatica (nada de `process.env[chave]`).
 */
const RAW_ENV: Readonly<Record<RequiredEnvKey, string | undefined>> = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_DATABASE_URL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** Client IDs do Google OAuth. Ausentes = botao do Google desabilitado. */
export type GoogleClientIds = {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
};

export const googleClientIds: GoogleClientIds = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};

/**
 * Client ID exigido pelo fluxo nativo da plataforma atual.
 *
 * Cada plataforma precisa do SEU proprio client: um client Web nao aceita o
 * redirect `exp://` gerado no Android/iOS, entao reaproveita-lo ali levaria a
 * um `redirect_uri_mismatch` na cara do usuario.
 */
export const nativeGoogleClientId: string | undefined = Platform.select({
  android: googleClientIds.androidClientId,
  ios: googleClientIds.iosClientId,
  default: undefined,
});

/** `true` quando a plataforma atual tem o client ID nativo necessario. */
export const isNativeGoogleSignInConfigured: boolean =
  typeof nativeGoogleClientId === 'string' && nativeGoogleClientId.length > 0;

function collectMissingKeys(): RequiredEnvKey[] {
  return REQUIRED_ENV_KEYS.filter((key) => {
    const value = RAW_ENV[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

export const missingFirebaseEnvKeys: readonly RequiredEnvKey[] = collectMissingKeys();

export const isFirebaseConfigured: boolean = missingFirebaseEnvKeys.length === 0;

/**
 * Valores de reserva usados quando o `.env` ainda nao foi preenchido. Eles
 * mantem o app inicializavel (sem tela vermelha no boot) enquanto a interface
 * exibe as instrucoes de configuracao -- ver `SetupScreen`.
 */
const PLACEHOLDER_OPTIONS: FirebaseOptions = {
  apiKey: 'firebase-nao-configurado',
  authDomain: 'firebase-nao-configurado.firebaseapp.com',
  databaseURL: 'https://firebase-nao-configurado-default-rtdb.firebaseio.com',
  projectId: 'firebase-nao-configurado',
  appId: '1:000000000000:web:000000000000',
};

/** Opcoes usadas para inicializar o Firebase App. */
export function getFirebaseOptions(): FirebaseOptions {
  if (!isFirebaseConfigured) {
    return PLACEHOLDER_OPTIONS;
  }

  return {
    apiKey: RAW_ENV.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: RAW_ENV.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: RAW_ENV.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: RAW_ENV.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: RAW_ENV.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

/** Guarda usada pelas acoes de autenticacao antes de falar com o Firebase. */
export function assertFirebaseConfigured(): void {
  if (!isFirebaseConfigured) {
    throw new ConfigurationError(
      'Configuracao do Firebase incompleta. Copie o arquivo .env.example para .env e ' +
        `preencha: ${missingFirebaseEnvKeys.join(', ')}.`,
    );
  }
}
