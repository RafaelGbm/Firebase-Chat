import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { translateError } from '../utils/errors';
import { useAuth } from './useAuth';

/** Codigo devolvido pela Apple quando a pessoa cancela a folha de autorizacao. */
const APPLE_CANCELED_CODE = 'ERR_REQUEST_CANCELED';

export type AppleSignInState = {
  isAvailable: boolean;
  isPending: boolean;
  unavailableReason: string | null;
  error: string | null;
  signIn: () => Promise<void>;
};

function buildFullName(fullName: AppleAuthentication.AppleAuthenticationFullName | null): string | null {
  if (!fullName) {
    return null;
  }

  const parts = [fullName.givenName, fullName.familyName].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0,
  );

  return parts.length > 0 ? parts.join(' ') : null;
}

function isCanceledError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === APPLE_CANCELED_CODE
  );
}

/**
 * Fluxo de login com Apple usando `expo-apple-authentication`.
 *
 * O Firebase exige o `rawNonce`, enquanto a Apple recebe o hash SHA-256 desse
 * mesmo valor -- e assim que o backend confirma que o token nao foi reutilizado.
 */
export function useAppleSignIn(): AppleSignInState {
  const { signInWithApple } = useAuth();
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // A folha da Apple so existe em iOS 13+; nas demais plataformas o botao fica
  // visivel, porem desabilitado e com a justificativa na tela.
  useEffect(() => {
    let active = true;

    if (Platform.OS !== 'ios') {
      setIsAvailable(false);
      return () => {
        active = false;
      };
    }

    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (active) {
          setIsAvailable(available);
        }
      })
      .catch(() => {
        if (active) {
          setIsAvailable(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const unavailableReason = useMemo<string | null>(() => {
    if (Platform.OS !== 'ios') {
      return 'O login com Apple esta disponivel apenas em dispositivos iOS.';
    }

    if (!isAvailable) {
      return 'Este dispositivo iOS nao suporta o Sign in with Apple.';
    }

    return null;
  }, [isAvailable]);

  const signIn = useCallback(async (): Promise<void> => {
    setError(null);

    if (!isAvailable) {
      setError(unavailableReason);
      return;
    }

    setIsPending(true);

    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        setError('A Apple nao devolveu o token de identificacao.');
        return;
      }

      await signInWithApple({
        identityToken: credential.identityToken,
        rawNonce,
        fullName: buildFullName(credential.fullName),
        email: credential.email,
      });
    } catch (appleError: unknown) {
      if (!isCanceledError(appleError)) {
        setError(translateError(appleError, 'Nao foi possivel entrar com a Apple.'));
      }
    } finally {
      setIsPending(false);
    }
  }, [isAvailable, signInWithApple, unavailableReason]);

  return { isAvailable, isPending, unavailableReason, error, signIn };
}
