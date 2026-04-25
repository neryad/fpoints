import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "src/core/theme/ThemeProvider";

import { TasksStackParamList } from "./types";
import { TasksScreen } from "src/features/tasks/screens/TasksScreen";
import { TaskDetailScreen } from "src/features/tasks/screens/TaskDetailScreen";
import { CreateTaskScreen } from "src/features/tasks/screens/CreateTaskScreen";
import { SubmitTaskScreen } from "src/features/tasks/screens/SubmitTaskScreen";
import { ApprovalsScreen } from "src/features/tasks/screens/ApprovalsScreen";

const Stack = createNativeStackNavigator<TasksStackParamList>();

export function TasksNavigator() {
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
        name="TasksList"
        component={TasksScreen}
        options={{ title: "Tasks" }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: "Task Detail" }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{ title: "New Task" }}
      />
      <Stack.Screen
        name="SubmitTask"
        component={SubmitTaskScreen}
        options={{ title: "Submit Completion" }}
      />
      <Stack.Screen
        name="Approvals"
        component={ApprovalsScreen}
        options={{ title: "Pending Approvals" }}
      />
    </Stack.Navigator>
  );
}
