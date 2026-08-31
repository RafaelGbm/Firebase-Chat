import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isFirebaseConfigured } from './src/config/firebaseConfig';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SetupScreen } from './src/screens/SetupScreen';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {isFirebaseConfigured ? (
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      ) : (
        <SetupScreen />
      )}
    </SafeAreaProvider>
  );
}
