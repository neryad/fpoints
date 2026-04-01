import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HomeStackParamList } from "./types";
import { HomeScreen } from "../../features/home/screens/HomeScreen";
import { PointHistoryScreen } from "../../features/home/screens/PointHistoryScreen";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeDashboard"
        component={HomeScreen}
        options={{ title: "Home" , headerShown: false }}
      />
      <Stack.Screen
        name="PointHistory"
        component={PointHistoryScreen}
        options={{ title: "Point History" }}
      />
    </Stack.Navigator>
  );
}
