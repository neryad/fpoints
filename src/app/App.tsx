import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppSessionProvider } from './providers/AppSessionProvider';
import { RootNavigator } from './navigation/RootNavigator';


export default function App() {
  return (
    <SafeAreaProvider>
      <AppSessionProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AppSessionProvider>
    </SafeAreaProvider>
  );
}
