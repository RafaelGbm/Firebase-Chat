import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorMessage } from '../components/ErrorMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { colors, radii, spacing, typography } from '../theme/theme';

/** Retorno da ultima acao executada na tela, usado para o feedback visual. */
type VerificationFeedback =
  | { kind: 'idle' }
  | { kind: 'resent' }
  | { kind: 'stillPending' };

/**
 * Barreira entre o cadastro e o chat: contas de e-mail/senha so avancam depois
 * de confirmar o endereco pelo link enviado por e-mail.
 */
export function VerifyEmailScreen(): React.JSX.Element {
  const { user, pending, error, clearError, resendVerification, checkVerification, signOut } =
    useAuth();

  const [feedback, setFeedback] = useState<VerificationFeedback>({ kind: 'idle' });

  const handleCheck = useCallback(async (): Promise<void> => {
    clearError();
    const verified = await checkVerification();

    // Se confirmou, o navegador troca de tela sozinho; so tratamos o "ainda nao".
    setFeedback(verified ? { kind: 'idle' } : { kind: 'stillPending' });
  }, [checkVerification, clearError]);

  const handleResend = useCallback(async (): Promise<void> => {
    clearError();
    const sent = await resendVerification();
    setFeedback(sent ? { kind: 'resent' } : { kind: 'idle' });
  }, [clearError, resendVerification]);

  const handleCheckPress = useCallback((): void => {
    void handleCheck();
  }, [handleCheck]);

  const handleResendPress = useCallback((): void => {
    void handleResend();
  }, [handleResend]);

  const handleSignOut = useCallback((): void => {
    void signOut();
  }, [signOut]);

  const feedbackMessage = useMemo<string | null>(() => {
    if (feedback.kind === 'resent') {
      return 'Enviamos um novo link. Confira sua caixa de entrada.';
    }

    if (feedback.kind === 'stillPending') {
      return 'Ainda nao recebemos a confirmacao. Abra o link do e-mail e toque novamente.';
    }

    return null;
  }, [feedback]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.icon}>📬</Text>

        <View style={styles.header}>
          <Text style={styles.title}>Confirme seu e-mail</Text>
          <Text style={styles.subtitle}>
            Enviamos um link de confirmacao para{' '}
            <Text style={styles.email}>{user?.email ?? 'seu endereco'}</Text>. Abra o link e depois
            volte aqui.
          </Text>
        </View>

        <ErrorMessage message={error} />

        {feedbackMessage ? (
          <View
            style={[
              styles.feedback,
              feedback.kind === 'resent' ? styles.feedbackSuccess : styles.feedbackPending,
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                feedback.kind === 'resent' ? styles.feedbackTextSuccess : null,
              ]}
            >
              {feedbackMessage}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton label="Ja confirmei" onPress={handleCheckPress} loading={pending} disabled={pending} />
          <PrimaryButton
            label="Reenviar e-mail"
            variant="secondary"
            onPress={handleResendPress}
            disabled={pending}
          />
          <PrimaryButton
            label="Sair e usar outra conta"
            variant="ghost"
            onPress={handleSignOut}
            disabled={pending}
          />
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Nao chegou?</Text>
          <Text style={styles.hintText}>
            Verifique a caixa de spam ou lixo eletronico. O remetente e o proprio Firebase, com o
            nome do projeto no assunto.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  icon: {
    fontSize: 44,
    textAlign: 'center',
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  email: {
    color: colors.text,
    fontWeight: '700',
  },
  feedback: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  feedbackSuccess: {
    backgroundColor: colors.surface,
    borderColor: colors.success,
  },
  feedbackPending: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  feedbackText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 21,
  },
  feedbackTextSuccess: {
    color: colors.success,
  },
  actions: {
    gap: spacing.sm,
  },
  hintCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  hintTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
