import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { HomeNavigator } from "./HomeNavigator";
import { TasksNavigator } from "./TasksNavigator";
import { ProfileNavigator } from "./ProfileNavigator";
import { RewardsNavigator } from "./RewardsNavigator";
import { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabsNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
