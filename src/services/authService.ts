import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';

import type { AuthProvider, ChatUser } from '../types/user';
import { auth } from './firebase';

export type EmailSignUpInput = {
  name: string;
  email: string;
  password: string;
};

export type EmailSignInInput = {
  email: string;
  password: string;
};

export type AppleSignInInput = {
  identityToken: string;
  rawNonce: string;
  fullName: string | null;
  email: string | null;
};

/** `providerId` do Firebase -> provedor normalizado da aplicacao. */
const PROVIDER_ID_MAP: Readonly<Record<string, AuthProvider>> = {
  password: 'password',
  'google.com': 'google',
  'apple.com': 'apple',
};

/**
 * Descobre com qual provedor o usuario entrou, olhando o `providerData` devolvido
 * pelo Firebase Authentication. Nunca ha usuario "hardcoded".
 */
export function resolveAuthProvider(user: User): AuthProvider {
  for (const info of user.providerData) {
    const provider = PROVIDER_ID_MAP[info.providerId];
    if (provider) {
      return provider;
    }
  }

  // Contas criadas por e-mail/senha podem vir sem `providerData` em cache frio.
  return 'password';
}

function fallbackNameFromEmail(email: string | null): string {
  if (!email) {
    return 'Usuario';
  }

  const [localPart] = email.split('@');
  return localPart.length > 0 ? localPart : 'Usuario';
}

/** Converte o `User` do Firebase no modelo de dominio da aplicacao. */
export function mapFirebaseUser(user: User): ChatUser {
  const displayName = user.displayName?.trim();

  return {
    uid: user.uid,
    name: displayName && displayName.length > 0 ? displayName : fallbackNameFromEmail(user.email),
    email: user.email,
    provider: resolveAuthProvider(user),
  };
}

/**
 * Contas de e-mail/senha so liberam o chat depois de confirmar o endereco pelo
 * link enviado por e-mail. Google e Apple ja entregam o e-mail verificado pelo
 * proprio provedor, entao nao passam por esta etapa.
 */
export function requiresEmailVerification(user: User): boolean {
  return resolveAuthProvider(user) === 'password' && !user.emailVerified;
}

/**
 * Cria uma conta com e-mail e senha, grava o nome de exibicao e dispara o
 * e-mail de confirmacao.
 */
export async function signUpWithEmail({ name, email, password }: EmailSignUpInput): Promise<ChatUser> {
  const credential: UserCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  const trimmedName = name.trim();
  if (trimmedName.length > 0) {
    await updateProfile(credential.user, { displayName: trimmedName });
  }

  await sendEmailVerification(credential.user);

  return mapFirebaseUser(credential.user);
}

/** Reenvia o link de confirmacao para o usuario autenticado no momento. */
export async function resendVerificationEmail(): Promise<void> {
  const current = auth.currentUser;

  if (!current) {
    throw new Error('Nenhuma sessao ativa para reenviar a confirmacao.');
  }

  await sendEmailVerification(current);
}

/**
 * Recarrega o usuario a partir do servidor e informa se o e-mail ja foi
 * confirmado. O `onAuthStateChanged` nao dispara quando o link e aberto em
 * outro dispositivo, por isso a verificacao precisa ser explicita.
 */
export async function refreshVerificationStatus(): Promise<boolean> {
  const current = auth.currentUser;

  if (!current) {
    return false;
  }

  await reload(current);
  return !requiresEmailVerification(current);
}

/** Login com e-mail e senha. */
export async function signInWithEmail({ email, password }: EmailSignInInput): Promise<ChatUser> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return mapFirebaseUser(credential.user);
}

/**
 * Login com Google na web.
 *
 * Usa o fluxo hospedado pelo proprio Firebase (`signInWithPopup`), que valida
 * a origem pelos dominios autorizados do projeto -- por isso nao exige client
 * ID nem redirect URI cadastrados a mao no Google Cloud Console.
 *
 * Esta funcao so existe no bundle web do Firebase; no Android e no iOS o fluxo
 * usado e o `signInWithGoogleIdToken`, alimentado pelo expo-auth-session.
 */
export async function signInWithGooglePopup(): Promise<ChatUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  return mapFirebaseUser(result.user);
}

/** Login com Google no Android e no iOS, a partir do `id_token` do expo-auth-session. */
export async function signInWithGoogleIdToken(idToken: string): Promise<ChatUser> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return mapFirebaseUser(result.user);
}

/**
 * Login com Apple. A Apple entrega o nome completo apenas na primeira
 * autorizacao, entao ele e gravado no perfil assim que chega.
 */
export async function signInWithApple({
  identityToken,
  rawNonce,
  fullName,
}: AppleSignInInput): Promise<ChatUser> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken, rawNonce });
  const result = await signInWithCredential(auth, credential);

  const trimmedName = fullName?.trim();
  if (trimmedName && trimmedName.length > 0 && !result.user.displayName) {
    await updateProfile(result.user, { displayName: trimmedName });
  }

  return mapFirebaseUser(result.user);
}

/** Encerra a sessao atual. */
export async function signOutCurrentUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Observa o estado de autenticacao. Devolve a funcao de cancelamento para que o
 * listener seja removido no cleanup do `useEffect`.
 */
export function observeAuthState(
  onChange: (user: User | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onAuthStateChanged(auth, onChange, onError);
}
