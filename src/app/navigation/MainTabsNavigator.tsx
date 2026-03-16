import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TasksNavigator } from './TasksNavigator';
import { MainTabParamList } from './types';
import { HomeScreen } from 'src/features/home/screens/HomeScreen';
import { ProfileScreen } from 'src/features/profile/screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabsNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
