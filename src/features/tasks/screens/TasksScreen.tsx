import React, { useEffect } from "react";
import {
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../core/theme/colors";
import { TasksStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTasks } from "../hooks/useTasks";

type Props = NativeStackScreenProps<TasksStackParamList, "TasksList">;

export function TasksScreen({ navigation }: Props) {
  const { activeGroupId } = useAppSession();
  const { tasks, isLoading, error, reload } = useTasks(activeGroupId);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", reload);
    return unsubscribe;
  }, [navigation, reload]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="Pending Approvals"
          onPress={() => navigation.navigate("Approvals")}
        />
        <View style={styles.headerSpacer} />
        <Button
          title="+ New Task"
          onPress={() => navigation.navigate("CreateTask")}
        />
      </View>

      {isLoading ? <Text style={styles.infoText}>Loading tasks...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!isLoading && !error && tasks.length === 0 ? (
        <Text style={styles.infoText}>
          No hay tareas activas en este grupo.
        </Text>
      ) : null}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.taskCard}
            onPress={() =>
              navigation.navigate("TaskDetail", { taskId: item.id })
            }
          >
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskMeta}>{item.pointsValue} pts</Text>
            {item.requiresProof ? (
              <Text style={styles.taskMeta}>Requiere prueba</Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  headerSpacer: {
    height: 8,
  },
  list: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  taskMeta: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },
  infoText: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 40,
  },
  errorText: {
    textAlign: "center",
    color: "#ef4444",
    marginTop: 16,
  },
});
