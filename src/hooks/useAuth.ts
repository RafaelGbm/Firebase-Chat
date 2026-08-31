import { useContext } from 'react';

import { AuthContext, type AuthContextValue } from '../contexts/AuthContext';

/** Acessa o estado de autenticacao garantindo que exista um `AuthProvider` acima. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de <AuthProvider>.');
  }

  return context;
}
