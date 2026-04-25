import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthNavigator } from "./AuthNavigator";
import { GroupNavigator } from "./GroupNavigator";
import { MainTabsNavigator } from "./MainTabsNavigator";
import { useAppSession } from "../providers/AppSessionProvider";
import { useTheme } from "../../core/theme/ThemeProvider";

export function RootNavigator() {
  const { hasActiveGroup, isAuthenticated, isBootstrapping } = useAppSession();
  const { colors } = useTheme();

  if (isBootstrapping) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (!hasActiveGroup) {
    return <GroupNavigator />;
  }

  return <MainTabsNavigator />;
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
