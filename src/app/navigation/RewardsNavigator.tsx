import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../../core/theme/ThemeProvider";
import { RewardsStackParamList } from "./types";
import { RewardsScreen } from "../../features/rewards/screens/RewardsScreen";
import { ManageRewardsScreen } from "../../features/rewards/screens/ManageRewardsScreen";
import { MyRedemptionsScreen } from "../../features/rewards/screens/MyRedemptionsScreen";
import { RewardApprovalsScreen } from "../../features/rewards/screens/RewardApprovalsScreen";

const Stack = createNativeStackNavigator<RewardsStackParamList>();

export function RewardsNavigator() {
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
        name="RewardsList"
        component={RewardsScreen}
        options={{ title: "Rewards" }}
      />
      <Stack.Screen
        name="ManageRewards"
        component={ManageRewardsScreen}
        options={{ title: "Gestionar premios" }}
      />
      <Stack.Screen
        name="MyRedemptions"
        component={MyRedemptionsScreen}
        options={{ title: "Mis canjes" }}
      />
      <Stack.Screen
        name="RewardApprovals"
        component={RewardApprovalsScreen}
        options={{ title: "Aprobar canjes" }}
      />
    </Stack.Navigator>
  );
}
