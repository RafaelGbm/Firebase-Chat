import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

/**
 * `getReactNativePersistence` existe em tempo de execucao no entry point React
 * Native do `@firebase/auth` (reexportado por `firebase/auth`), mas o pacote
 * publica apenas as tipagens do bundle browser. A declaracao abaixo apenas
 * descreve a funcao que ja existe, mantendo o projeto 100% tipado e sem `any`.
 */
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
