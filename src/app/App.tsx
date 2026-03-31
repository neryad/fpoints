import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppSessionProvider } from "./providers/AppSessionProvider";
import { RootNavigator } from "./navigation/RootNavigator";
import "./global.css";
import { ThemeProvider } from "src/core/theme/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppSessionProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppSessionProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
