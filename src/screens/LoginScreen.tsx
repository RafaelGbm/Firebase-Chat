import React, { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorMessage } from '../components/ErrorMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { useAppleSignIn } from '../hooks/useAppleSignIn';
import { useAuth } from '../hooks/useAuth';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { colors, radii, spacing, typography } from '../theme/theme';

type FormMode = 'signIn' | 'signUp';

type FieldErrors = {
  name: string | null;
  email: string | null;
  password: string | null;
  confirmPassword: string | null;
};

const EMPTY_FIELD_ERRORS: FieldErrors = {
  name: null,
  email: null,
  password: null,
  confirmPassword: null,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 6;

/** Tela de autenticacao: e-mail/senha, cadastro, Google e Apple. */
export function LoginScreen(): React.JSX.Element {
  const { signIn, signUp, pending, error, clearError } = useAuth();
  const google = useGoogleSignIn();
  const apple = useAppleSignIn();

  const [mode, setMode] = useState<FormMode>('signIn');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_FIELD_ERRORS);

  const isSignUp = mode === 'signUp';
  const isBusy = pending || google.isPending || apple.isPending;

  // Um unico ponto de exibicao de erro, venha ele de qual fluxo vier.
  const visibleError = useMemo<string | null>(
    () => error ?? google.error ?? apple.error,
    [apple.error, error, google.error],
  );

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = { ...EMPTY_FIELD_ERRORS };

    if (isSignUp && name.trim().length < 2) {
      errors.name = 'Informe seu nome (minimo 2 caracteres).';
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Informe um e-mail valido.';
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `A senha precisa ter no minimo ${MIN_PASSWORD_LENGTH} caracteres.`;
    }

    if (isSignUp && confirmPassword !== password) {
      errors.confirmPassword = 'As senhas nao conferem.';
    }

    return errors;
  }, [confirmPassword, email, isSignUp, name, password]);

  const handleEmailSubmit = useCallback(async (): Promise<void> => {
    const errors = validate();
    setFieldErrors(errors);

    const hasError = Object.values(errors).some((message) => message !== null);
    if (hasError) {
      return;
    }

    if (isSignUp) {
      await signUp({ name, email, password });
      return;
    }

    await signIn({ email, password });
  }, [email, isSignUp, name, password, signIn, signUp, validate]);

  const handleEmailPress = useCallback((): void => {
    void handleEmailSubmit();
  }, [handleEmailSubmit]);

  const handleToggleMode = useCallback((): void => {
    setMode((previous) => (previous === 'signIn' ? 'signUp' : 'signIn'));
    setConfirmPassword('');
    setFieldErrors(EMPTY_FIELD_ERRORS);
    clearError();
  }, [clearError]);

  const handleGooglePress = useCallback((): void => {
    clearError();
    void google.signIn();
  }, [clearError, google]);

  const handleApplePress = useCallback((): void => {
    clearError();
    void apple.signIn();
  }, [apple, clearError]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Chat Firebase</Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Crie sua conta. Voce recebera um link para confirmar o e-mail.'
                : 'Entre para conversar em tempo real.'}
            </Text>
          </View>

          <ErrorMessage message={visibleError} />

          <View style={styles.form}>
            {isSignUp ? (
              <TextField
                label="Nome"
                value={name}
                onChangeText={setName}
                placeholder="Como voce quer ser chamado"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                editable={!isBusy}
                errorText={fieldErrors.name}
              />
            ) : null}

            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="voce@exemplo.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!isBusy}
              errorText={fieldErrors.email}
            />

            <TextField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Minimo de 6 caracteres"
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              textContentType="password"
              editable={!isBusy}
              errorText={fieldErrors.password}
            />

            {isSignUp ? (
              <TextField
                label="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repita a senha"
                secureTextEntry
                autoComplete="new-password"
                textContentType="password"
                editable={!isBusy}
                errorText={fieldErrors.confirmPassword}
              />
            ) : null}

            <PrimaryButton
              label={isSignUp ? 'Criar conta' : 'Entrar'}
              onPress={handleEmailPress}
              loading={pending}
              disabled={isBusy}
            />

            <PrimaryButton
              label={isSignUp ? 'Ja tenho conta. Entrar' : 'Nao tenho conta. Cadastrar'}
              onPress={handleToggleMode}
              variant="ghost"
              disabled={isBusy}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>ou continue com</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.providers}>
            <PrimaryButton
              label="Entrar com Google"
              variant="secondary"
              onPress={handleGooglePress}
              loading={google.isPending}
              disabled={isBusy || !google.isAvailable}
            />
            {google.unavailableReason ? (
              <Text style={styles.hint}>{google.unavailableReason}</Text>
            ) : null}

            <PrimaryButton
              label="Entrar com Apple"
              variant="secondary"
              onPress={handleApplePress}
              loading={apple.isPending}
              disabled={isBusy || !apple.isAvailable}
            />
            {apple.unavailableReason ? (
              <Text style={styles.hint}>{apple.unavailableReason}</Text>
            ) : null}
          </View>

          <View style={styles.ruleCard}>
            <Text style={styles.ruleTitle}>Regra de conversa</Text>
            <Text style={styles.ruleText}>
              Quem entra com e-mail e senha conversa apenas com contas Google ou Apple. Quem entra
              com Google ou Apple conversa apenas com contas de e-mail e senha.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
  form: {
    gap: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  providers: {
    gap: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 17,
    marginBottom: spacing.xs,
  },
  ruleCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  ruleTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ruleText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
