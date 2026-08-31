/**
 * Provedores de autenticacao suportados pela aplicacao.
 * O valor corresponde ao `providerId` do Firebase Authentication ja normalizado
 * (`password`, `google.com` -> `google`, `apple.com` -> `apple`).
 */
export type AuthProvider = 'password' | 'google' | 'apple';

/** Usuario autenticado, sempre identificado pelo `uid` do Firebase Auth. */
export type ChatUser = {
  uid: string;
  name: string;
  email: string | null;
  provider: AuthProvider;
};

/** Formato exato do no `users/{uid}` no Realtime Database. */
export type ChatUserRecord = ChatUser & {
  createdAt: number;
  updatedAt: number;
};

export const AUTH_PROVIDERS: readonly AuthProvider[] = ['password', 'google', 'apple'];

export const PROVIDER_LABELS: Readonly<Record<AuthProvider, string>> = {
  password: 'E-mail e senha',
  google: 'Google',
  apple: 'Apple',
};

export const PROVIDER_SHORT_LABELS: Readonly<Record<AuthProvider, string>> = {
  password: 'E-mail',
  google: 'Google',
  apple: 'Apple',
};

/** Type guard usado para validar dados vindos do Firebase sem recorrer a `any`. */
export function isAuthProvider(value: unknown): value is AuthProvider {
  return typeof value === 'string' && (AUTH_PROVIDERS as readonly string[]).includes(value);
}
