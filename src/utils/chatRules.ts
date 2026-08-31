import { AUTH_PROVIDERS, PROVIDER_LABELS, type AuthProvider, type ChatUser } from '../types/user';

/**
 * Regra de comunicacao do trabalho:
 *
 *   E-mail/Senha <-> Google      OK
 *   E-mail/Senha <-> Apple       OK
 *   E-mail/Senha <-> E-mail/Senha  X
 *   Google       <-> Google        X
 *   Apple        <-> Apple         X
 *   Google       <-> Apple         X
 *
 * Ou seja: exatamente UM dos dois lados precisa ser `password`.
 */
export function canProvidersChat(a: AuthProvider, b: AuthProvider): boolean {
  return (a === 'password') !== (b === 'password');
}

/** Provedores com os quais um usuario do provedor informado pode conversar. */
export function getAllowedProviders(provider: AuthProvider): AuthProvider[] {
  return AUTH_PROVIDERS.filter((candidate) => canProvidersChat(provider, candidate));
}

/** Rotulo amigavel dos provedores permitidos, usado nas telas. */
export function describeAllowedProviders(provider: AuthProvider): string {
  return getAllowedProviders(provider)
    .map((allowed) => PROVIDER_LABELS[allowed])
    .join(' ou ');
}

/**
 * Um contato so aparece na lista se nao for o proprio usuario e se o par de
 * provedores for permitido. Garante tambem o chat exclusivamente 1 para 1.
 */
export function canUsersChat(current: ChatUser, candidate: ChatUser): boolean {
  if (current.uid === candidate.uid) {
    return false;
  }

  return canProvidersChat(current.provider, candidate.provider);
}

/** Erro de dominio lancado quando a regra entre provedores e violada. */
export class ChatRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatRuleError';
  }
}

/** Barreira final antes de criar a conversa ou enviar uma mensagem. */
export function assertCanUsersChat(current: ChatUser, contact: ChatUser): void {
  if (current.uid === contact.uid) {
    throw new ChatRuleError('Nao e possivel iniciar uma conversa com voce mesmo.');
  }

  if (!canProvidersChat(current.provider, contact.provider)) {
    throw new ChatRuleError(
      `Quem entrou com ${PROVIDER_LABELS[current.provider]} so pode conversar com ` +
        `${describeAllowedProviders(current.provider)}.`,
    );
  }
}

/**
 * Identificador deterministico da conversa: os dois `uid` ordenados e unidos por
 * `_`. Com isso o mesmo par de usuarios sempre resolve para a mesma conversa,
 * independentemente de quem iniciou, e as regras de seguranca conseguem validar
 * o vinculo entre o id e os participantes.
 */
export function buildConversationId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

/** Participantes na mesma ordem usada para montar o id da conversa. */
export function buildParticipants(uidA: string, uidB: string): [string, string] {
  const [first, second] = [uidA, uidB].sort();
  return [first, second];
}
