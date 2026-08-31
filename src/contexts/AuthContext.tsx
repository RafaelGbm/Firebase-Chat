import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { assertFirebaseConfigured } from '../config/firebaseConfig';
import {
  mapFirebaseUser,
  observeAuthState,
  refreshVerificationStatus,
  requiresEmailVerification,
  resendVerificationEmail,
  signInWithApple as signInWithAppleService,
  signInWithEmail,
  signInWithGoogleIdToken,
  signOutCurrentUser,
  signUpWithEmail,
  type AppleSignInInput,
  type EmailSignInInput,
  type EmailSignUpInput,
} from '../services/authService';
import { saveUserProfile } from '../services/userService';
import type { ChatUser } from '../types/user';
import { translateError } from '../utils/errors';

export type AuthContextValue = {
  /** Usuario autenticado ou `null` quando a sessao esta encerrada. */
  user: ChatUser | null;
  /** `true` enquanto o Firebase ainda nao respondeu o estado inicial da sessao. */
  initializing: boolean;
  /** `true` enquanto uma acao de autenticacao esta em andamento. */
  pending: boolean;
  /** `true` quando a conta e de e-mail/senha e o endereco ainda nao foi confirmado. */
  awaitingVerification: boolean;
  error: string | null;
  clearError: () => void;
  reportError: (error: unknown) => void;
  signUp: (input: EmailSignUpInput) => Promise<boolean>;
  signIn: (input: EmailSignInInput) => Promise<boolean>;
  signInWithGoogle: (idToken: string) => Promise<boolean>;
  signInWithApple: (input: AppleSignInInput) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Reenvia o link de confirmacao. Devolve `true` em caso de sucesso. */
  resendVerification: () => Promise<boolean>;
  /** Reconsulta o servidor. Devolve `true` quando o e-mail ja foi confirmado. */
  checkVerification: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [pending, setPending] = useState<boolean>(false);
  const [awaitingVerification, setAwaitingVerification] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Nome capturado no cadastro ou no login com Apple. Esses provedores entregam
   * o nome apenas uma vez, e o evento de mudanca de sessao chega antes de o
   * `displayName` ser gravado -- por isso ele fica guardado aqui ate ser usado.
   */
  const pendingNameRef = useRef<string | null>(null);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const reportError = useCallback((unknownError: unknown): void => {
    setError(translateError(unknownError));
  }, []);

  // Fonte unica da verdade sobre a sessao: o proprio Firebase Authentication.
  useEffect(() => {
    const unsubscribe = observeAuthState(
      (firebaseUser) => {
        if (!firebaseUser) {
          pendingNameRef.current = null;
          setUser(null);
          setAwaitingVerification(false);
          setInitializing(false);
          return;
        }

        const mapped = mapFirebaseUser(firebaseUser);
        const pendingName = pendingNameRef.current;
        pendingNameRef.current = null;

        setUser(
          pendingName && pendingName.length > 0 ? { ...mapped, name: pendingName } : mapped,
        );
        setAwaitingVerification(requiresEmailVerification(firebaseUser));
        setInitializing(false);
      },
      (authError) => {
        setError(translateError(authError));
        setInitializing(false);
      },
    );

    // Remove o listener quando o provider e desmontado.
    return unsubscribe;
  }, []);

  /**
   * O perfil publico so vai para o Realtime Database depois que o e-mail e
   * confirmado -- assim contas nao verificadas nao aparecem na lista de
   * contatos de ninguem.
   */
  useEffect(() => {
    if (!user || awaitingVerification) {
      return;
    }

    let active = true;

    saveUserProfile(user).catch((profileError: unknown) => {
      if (active) {
        setError(translateError(profileError, 'Nao foi possivel salvar seu perfil.'));
      }
    });

    return () => {
      active = false;
    };
  }, [awaitingVerification, user]);

  /** Executa uma acao de autenticacao tratando loading e erro de forma unificada. */
  const runAuthAction = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      setPending(true);
      setError(null);

      try {
        assertFirebaseConfigured();
        await action();
        return true;
      } catch (actionError: unknown) {
        setError(translateError(actionError));
        return false;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const signUp = useCallback(
    (input: EmailSignUpInput): Promise<boolean> =>
      runAuthAction(async () => {
        pendingNameRef.current = input.name.trim();
        await signUpWithEmail(input);
      }),
    [runAuthAction],
  );

  const signIn = useCallback(
    (input: EmailSignInInput): Promise<boolean> =>
      runAuthAction(async () => {
        await signInWithEmail(input);
      }),
    [runAuthAction],
  );

  const signInWithGoogle = useCallback(
    (idToken: string): Promise<boolean> =>
      runAuthAction(async () => {
        await signInWithGoogleIdToken(idToken);
      }),
    [runAuthAction],
  );

  const signInWithApple = useCallback(
    (input: AppleSignInInput): Promise<boolean> =>
      runAuthAction(async () => {
        pendingNameRef.current = input.fullName?.trim() ?? null;
        await signInWithAppleService(input);
      }),
    [runAuthAction],
  );

  const resendVerification = useCallback(
    (): Promise<boolean> =>
      runAuthAction(async () => {
        await resendVerificationEmail();
      }),
    [runAuthAction],
  );

  const checkVerification = useCallback(async (): Promise<boolean> => {
    setPending(true);
    setError(null);

    try {
      const verified = await refreshVerificationStatus();
      setAwaitingVerification(!verified);
      return verified;
    } catch (checkError: unknown) {
      setError(translateError(checkError, 'Nao foi possivel verificar seu e-mail.'));
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setPending(true);

    try {
      await signOutCurrentUser();
      // O listener de sessao tambem limpa o estado; aqui garantimos o retorno
      // imediato para o fluxo de autenticacao.
      setUser(null);
      setAwaitingVerification(false);
      setError(null);
    } catch (signOutError: unknown) {
      setError(translateError(signOutError, 'Nao foi possivel sair da conta.'));
    } finally {
      setPending(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      pending,
      awaitingVerification,
      error,
      clearError,
      reportError,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signOut,
      resendVerification,
      checkVerification,
    }),
    [
      user,
      initializing,
      pending,
      awaitingVerification,
      error,
      clearError,
      reportError,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signOut,
      resendVerification,
      checkVerification,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
