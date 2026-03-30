import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { TasksStackParamList } from "./types";
import { TasksScreen } from "src/features/tasks/screens/TasksScreen";
import { TaskDetailScreen } from "src/features/tasks/screens/TaskDetailScreen";
import { CreateTaskScreen } from "src/features/tasks/screens/CreateTaskScreen";
import { SubmitTaskScreen } from "src/features/tasks/screens/SubmitTaskScreen";
import { ApprovalsScreen } from "src/features/tasks/screens/ApprovalsScreen";

const Stack = createNativeStackNavigator<TasksStackParamList>();

export function TasksNavigator() {
  return (
    <Stack.Navigator>
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
