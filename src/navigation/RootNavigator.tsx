import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { Loading } from '../components/Loading';
import { useAuth } from '../hooks/useAuth';
import { ChatScreen } from '../screens/ChatScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { UsersScreen } from '../screens/UsersScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

/**
 * O stack e trocado conforme o estado da sessao. Ao sair, as telas autenticadas
 * sao desmontadas e o usuario volta obrigatoriamente para o login.
 */
export function RootNavigator(): React.JSX.Element {
  const { user, initializing, awaitingVerification } = useAuth();

  if (initializing) {
    return <Loading fullscreen message="Verificando sua sessao..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : awaitingVerification ? (
          <Stack.Screen
            name="VerifyEmail"
            component={VerifyEmailScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Group>
            <Stack.Screen name="Users" component={UsersScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: 'Conversa', headerBackTitle: 'Contatos' }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
