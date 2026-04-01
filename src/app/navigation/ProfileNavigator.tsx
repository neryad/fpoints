import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../../core/theme/ThemeProvider";
import { ProfileStackParamList } from "./types";
import { ProfileScreen } from "../../features/profile/screens/ProfileScreen";
import { GroupSettingsScreen } from "../../features/groups/screens/GroupSettingsScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
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
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
      <Stack.Screen
        name="GroupSettings"
        component={GroupSettingsScreen}
        options={{ title: "Configuración del grupo" }}
      />
    </Stack.Navigator>
  );
}
