import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../../core/theme/ThemeProvider";

import { HomeStackParamList } from "./types";
import { HomeScreen } from "../../features/home/screens/HomeScreen";
import { PointHistoryScreen } from "../../features/home/screens/PointHistoryScreen";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textStrong,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="HomeDashboard"
        component={HomeScreen}
        options={{ title: "Home" , headerShown: false }}
      />
      <Stack.Screen
        name="PointHistory"
        component={PointHistoryScreen}
        options={{ title: "Historial de puntos" }}
      />
    </Stack.Navigator>
  );
}
