import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { googleClientIds, isGoogleSignInConfigured } from '../config/firebaseConfig';
import { translateError } from '../utils/errors';
import { useAuth } from './useAuth';

// Fecha a janela do navegador assim que o fluxo OAuth retorna.
WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInState = {
  /** `true` quando existe pelo menos um client ID configurado. */
  isAvailable: boolean;
  /** `true` enquanto o navegador de autorizacao ou o Firebase estao trabalhando. */
  isPending: boolean;
  /** Mensagem de indisponibilidade exibida ao usuario. */
  unavailableReason: string | null;
  error: string | null;
  signIn: () => Promise<void>;
};

/**
 * Fluxo de login com Google usando `expo-auth-session`. O `id_token` devolvido
 * pelo Google e trocado por uma credencial do Firebase Authentication.
 */
export function useGoogleSignIn(): GoogleSignInState {
  const { signInWithGoogle } = useAuth();
  const [isExchanging, setIsExchanging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientIds.webClientId,
    webClientId: googleClientIds.webClientId,
    iosClientId: googleClientIds.iosClientId,
    androidClientId: googleClientIds.androidClientId,
  });

  // Reage ao retorno do fluxo OAuth.
  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type === 'success') {
      const idToken = response.params.id_token;

      if (!idToken) {
        setIsExchanging(false);
        setError('O Google nao devolveu o token de identificacao.');
        return;
      }

      let cancelled = false;
      setIsExchanging(true);

      void signInWithGoogle(idToken)
        .catch((signInError: unknown) => {
          if (!cancelled) {
            setError(translateError(signInError));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsExchanging(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    setIsExchanging(false);

    if (response.type === 'error') {
      setError(translateError(response.error, 'Nao foi possivel entrar com o Google.'));
    }
  }, [response, signInWithGoogle]);

  const unavailableReason = useMemo<string | null>(() => {
    if (!isGoogleSignInConfigured) {
      return 'Defina EXPO_PUBLIC_GOOGLE_*_CLIENT_ID no arquivo .env para habilitar o Google.';
    }

    return null;
  }, []);

  const signIn = useCallback(async (): Promise<void> => {
    setError(null);

    if (!isGoogleSignInConfigured) {
      setError(unavailableReason);
      return;
    }

    if (!request) {
      setError('O login com Google ainda esta sendo preparado. Tente novamente.');
      return;
    }

    try {
      setIsExchanging(true);
      const result = await promptAsync();

      if (result.type !== 'success') {
        setIsExchanging(false);
      }
    } catch (promptError: unknown) {
      setIsExchanging(false);
      setError(translateError(promptError, 'Nao foi possivel abrir o login do Google.'));
    }
  }, [promptAsync, request, unavailableReason]);

  return {
    isAvailable: isGoogleSignInConfigured && request !== null,
    isPending: isExchanging,
    unavailableReason,
    error,
    signIn,
  };
}
