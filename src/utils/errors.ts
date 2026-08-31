import { FirebaseError } from 'firebase/app';

import { ChatRuleError } from './chatRules';

/**
 * Mensagens em portugues para os codigos de erro mais comuns do Firebase
 * Authentication e do Realtime Database.
 */
const FIREBASE_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  'auth/invalid-email': 'E-mail invalido. Confira o endereco digitado.',
  'auth/missing-email': 'Informe o e-mail para continuar.',
  'auth/missing-password': 'Informe a senha para continuar.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'E-mail ou senha invalidos.',
  'auth/wrong-password': 'E-mail ou senha invalidos.',
  'auth/invalid-credential': 'E-mail ou senha invalidos.',
  'auth/invalid-login-credentials': 'E-mail ou senha invalidos.',
  'auth/email-already-in-use': 'Este e-mail ja possui uma conta. Faca login.',
  'auth/weak-password': 'A senha precisa ter no minimo 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Aguarde alguns instantes.',
  'auth/network-request-failed': 'Sem conexao com a internet. Verifique sua rede.',
  'auth/operation-not-allowed': 'Provedor nao habilitado no Console do Firebase.',
  'auth/account-exists-with-different-credential':
    'Ja existe uma conta com este e-mail usando outro provedor de login.',
  'auth/popup-closed-by-user': 'Login cancelado antes da conclusao.',
  'auth/invalid-credential-or-provider-id': 'Credencial do provedor invalida.',
  'auth/requires-recent-login': 'Entre novamente para concluir esta acao.',
  'auth/invalid-action-code': 'O link de confirmacao e invalido ou ja foi utilizado.',
  'auth/expired-action-code': 'O link de confirmacao expirou. Solicite um novo.',
  'auth/user-token-expired': 'Sua sessao expirou. Entre novamente.',
  'auth/unverified-email': 'Confirme seu e-mail antes de continuar.',
  PERMISSION_DENIED: 'Voce nao tem permissao para acessar estes dados.',
  'database/permission-denied': 'Voce nao tem permissao para acessar estes dados.',
  'database/disconnected': 'Sem conexao com o Realtime Database.',
  'database/network-error': 'Falha de rede ao falar com o Realtime Database.',
  'database/unavailable': 'Servico indisponivel no momento. Tente novamente.',
};

/** Erro de configuracao do projeto (variaveis de ambiente ausentes, etc.). */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function normalizeFirebaseCode(code: string): string {
  if (FIREBASE_ERROR_MESSAGES[code]) {
    return code;
  }

  // Erros do Realtime Database chegam como "PERMISSION_DENIED: ...".
  const upper = code.toUpperCase();
  return upper.includes('PERMISSION_DENIED') ? 'PERMISSION_DENIED' : code;
}

/**
 * Converte qualquer erro capturado (`unknown`) em uma mensagem compreensivel
 * para o usuario final. Evita o uso de `any` nos blocos `catch`.
 */
export function translateError(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (error instanceof ChatRuleError || error instanceof ConfigurationError) {
    return error.message;
  }

  if (error instanceof FirebaseError) {
    const code = normalizeFirebaseCode(error.code);
    return FIREBASE_ERROR_MESSAGES[code] ?? `${fallback} (${error.code})`;
  }

  if (error instanceof Error) {
    const byMessage = normalizeFirebaseCode(error.message);
    return FIREBASE_ERROR_MESSAGES[byMessage] ?? error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return fallback;
}
