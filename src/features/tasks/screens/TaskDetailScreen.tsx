import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../core/theme/colors";
import { TasksStackParamList } from "../../../app/navigation/types";
import { getTask } from "../services/tasks.service";
import type { Task } from "../types";

type Props = NativeStackScreenProps<TasksStackParamList, "TaskDetail">;

export function TaskDetailScreen({ route }: Props) {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTask(taskId)
      .then(setTask)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Error al cargar la tarea.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [taskId]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!task) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{task.title}</Text>
      {task.description ? (
        <Text style={styles.description}>{task.description}</Text>
      ) : null}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{task.pointsValue} puntos</Text>
      </View>
      {task.requiresProof ? (
        <Text style={styles.meta}>Requiere prueba fotográfica</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
  },
  badge: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: colors.primaryText,
    fontWeight: "700",
    fontSize: 16,
  },
  meta: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 13,
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
  },
});
