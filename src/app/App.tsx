import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppSessionProvider } from "./providers/AppSessionProvider";
import { RootNavigator } from "./navigation/RootNavigator";
import { ThemeProvider, useTheme } from "src/core/theme/ThemeProvider";

function AppContent() {
  const { isDark } = useTheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AppSessionProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AppSessionProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
