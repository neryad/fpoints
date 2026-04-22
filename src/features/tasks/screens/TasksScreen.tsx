import React, { useCallback, useEffect, useMemo } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TasksStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { Button } from "../../../components/ui/Button";
import { TaskCard } from "../../../components/ui/TaskCard";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonLoader } from "../../../components/ui/SkeletonLoader";
import { useTasks } from "../hooks/useTasks";

type Props = NativeStackScreenProps<TasksStackParamList, "TasksList">;

export function TasksScreen({ navigation }: Props) {
  const { colors, spacing, radius, fontSize, fontWeight } = useTheme();
  const { activeGroupId } = useAppSession();
  const { tasks, isLoading, error, reload } = useTasks(activeGroupId);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", reload);
    return unsubscribe;
  }, [navigation, reload]);

  const listContentStyle = useMemo(
    () => ({ paddingBottom: spacing[7], gap: spacing[3] }),
    [spacing],
  );

  const renderTask = useCallback(
    ({ item }: { item: typeof tasks[0] }) => (
      <TaskCard
        task={item}
        onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing[4] }} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.navigate("Approvals")}
          style={({ pressed }) => [
            styles.outlineBtn,
            {
              borderColor: colors.border,
              borderRadius: radius.full,
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text }}>
            Aprobaciones
          </Text>
        </Pressable>

        <Button
          label="+ Nueva tarea"
          onPress={() => navigation.navigate("CreateTask")}
          variant="primary"
          size="sm"
          fullWidth={false}
        />
      </View>

      {/* Loading */}
      {isLoading ? (
        <SkeletonLoader variant="list" count={4} />
      ) : null}

      {/* Error */}
      {!isLoading && error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Error al cargar"
          message={error}
          actionLabel="Reintentar"
          onAction={reload}
        />
      ) : null}

      {/* Empty */}
      {!isLoading && !error && tasks.length === 0 ? (
        <EmptyState
          icon="flag-outline"
          title="No hay tareas activas"
          message="No hay tareas en este grupo. ¡Crea la primera!"
          actionLabel="+ Nueva tarea"
          onAction={() => navigation.navigate("CreateTask")}
        />
      ) : null}

      {/* Lista */}
      {!isLoading && tasks.length > 0 ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={listContentStyle}
          renderItem={renderTask}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  outlineBtn: {
    borderWidth: 0.5,
    backgroundColor: "transparent",
  },
});
