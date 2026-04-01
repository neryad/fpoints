import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../core/theme/ThemeProvider';

import { GroupStackParamList } from './types';
import { GroupSelectionScreen } from 'src/features/groups/screens/GroupSelectionScreen';
import { CreateGroupScreen } from 'src/features/groups/screens/CreateGroupScreen';
import { JoinGroupScreen } from 'src/features/groups/screens/JoinGroupScreen';

const Stack = createNativeStackNavigator<GroupStackParamList>();

export function GroupNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textStrong,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="GroupSelection" component={GroupSelectionScreen} options={{ title: 'Select Group' }} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Create Group' }} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ title: 'Join Group' }} />
    </Stack.Navigator>
  );
}
