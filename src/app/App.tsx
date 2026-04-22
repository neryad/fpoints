import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppSessionProvider } from "./providers/AppSessionProvider";
import { RootNavigator } from "./navigation/RootNavigator";
import { ThemeProvider, useTheme } from "src/core/theme/ThemeProvider";
import { WebContainer } from "src/components/layout/WebContainer";
import { useAppFonts } from "../../design-system-rn/fonts/useAppFonts";

function AppContent() {
  const { isDark, colors } = useTheme();
  return (
    <WebContainer>
      <SafeAreaProvider style={{ backgroundColor: colors.background }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <AppSessionProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppSessionProvider>
      </SafeAreaProvider>
    </WebContainer>
  );
}

export default function App() {
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
