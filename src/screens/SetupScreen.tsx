import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { missingFirebaseEnvKeys } from '../config/firebaseConfig';
import { colors, radii, spacing, typography } from '../theme/theme';

/**
 * Exibida quando o `.env` ainda nao foi preenchido. Evita a tela vermelha de
 * erro e mostra exatamente o que falta configurar.
 */
export function SetupScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Configuracao pendente</Text>
        <Text style={styles.paragraph}>
          O aplicativo precisa das credenciais do seu projeto Firebase para funcionar.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Variaveis ausentes</Text>
          {missingFirebaseEnvKeys.map((key) => (
            <Text key={key} style={styles.code}>
              {key}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Como resolver</Text>
          <Text style={styles.step}>1. Copie o arquivo .env.example para .env</Text>
          <Text style={styles.step}>
            2. Preencha os valores com os dados do app Web em Console Firebase {'>'} Configuracoes do
            projeto
          </Text>
          <Text style={styles.step}>
            3. Habilite E-mail/Senha, Google e Apple em Authentication {'>'} Sign-in method
          </Text>
          <Text style={styles.step}>
            4. Publique as regras do arquivo database.rules.json no Realtime Database
          </Text>
          <Text style={styles.step}>5. Reinicie o servidor com npx expo start --clear</Text>
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
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  paragraph: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  code: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: 'monospace',
  },
  step: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 21,
  },
});
