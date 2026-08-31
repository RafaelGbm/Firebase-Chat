import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { googleClientIds, isGoogleSignInConfigured } from '../config/firebaseConfig';
import { translateError } from '../utils/errors';
import { useAuth } from './useAuth';

// Fecha a janela do navegador assim que o fluxo OAuth retorna (Android/iOS).
WebBrowser.maybeCompleteAuthSession();

const IS_WEB = Platform.OS === 'web';

export type GoogleSignInState = {
  /** `true` quando o fluxo da plataforma atual esta pronto para ser usado. */
  isAvailable: boolean;
  /** `true` enquanto o provedor ou o Firebase estao trabalhando. */
  isPending: boolean;
  /** Mensagem de indisponibilidade exibida ao usuario. */
  unavailableReason: string | null;
  error: string | null;
  signIn: () => Promise<void>;
};

/**
 * Login com Google, com um fluxo por plataforma:
 *
 * - **Web**: `signInWithPopup` do proprio Firebase. A origem e validada pelos
 *   dominios autorizados do projeto, entao nao e preciso cadastrar client ID
 *   nem redirect URI no Google Cloud Console.
 * - **Android/iOS**: `expo-auth-session`, que devolve um `id_token` trocado por
 *   uma credencial do Firebase. Aqui os client IDs sao obrigatorios, porque o
 *   popup do Firebase nao existe fora do navegador.
 */
export function useGoogleSignIn(): GoogleSignInState {
  const { signInWithGoogle, signInWithGoogleWeb } = useAuth();
  const [isExchanging, setIsExchanging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientIds.webClientId,
    webClientId: googleClientIds.webClientId,
    iosClientId: googleClientIds.iosClientId,
    androidClientId: googleClientIds.androidClientId,
  });

  // Reage ao retorno do fluxo OAuth nativo. Na web nada disso e usado.
  useEffect(() => {
    if (IS_WEB || !response) {
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
    if (IS_WEB || isGoogleSignInConfigured) {
      return null;
    }

    return 'No Android e no iOS, defina EXPO_PUBLIC_GOOGLE_*_CLIENT_ID no arquivo .env.';
  }, []);

  const signInOnWeb = useCallback(async (): Promise<void> => {
    try {
      setIsExchanging(true);
      await signInWithGoogleWeb();
    } catch (popupError: unknown) {
      setError(translateError(popupError, 'Nao foi possivel entrar com o Google.'));
    } finally {
      setIsExchanging(false);
    }
  }, [signInWithGoogleWeb]);

  const signInOnNative = useCallback(async (): Promise<void> => {
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

      // No sucesso o efeito acima assume; nos demais casos encerramos o loading.
      if (result.type !== 'success') {
        setIsExchanging(false);
      }
    } catch (promptError: unknown) {
      setIsExchanging(false);
      setError(translateError(promptError, 'Nao foi possivel abrir o login do Google.'));
    }
  }, [promptAsync, request, unavailableReason]);

  const signIn = useCallback(async (): Promise<void> => {
    setError(null);
    await (IS_WEB ? signInOnWeb() : signInOnNative());
  }, [signInOnNative, signInOnWeb]);

  return {
    isAvailable: IS_WEB || (isGoogleSignInConfigured && request !== null),
    isPending: isExchanging,
    unavailableReason,
    error,
    signIn,
  };
}
