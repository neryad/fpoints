import React, { useEffect } from "react";
import {
  ActivityIndicator,
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
import { useTasks } from "../hooks/useTasks";

type Props = NativeStackScreenProps<TasksStackParamList, "TasksList">;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing[4],             // 16
    },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing[4],        // 16
    },
    btnOutline: {
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],   // 12
      paddingVertical: spacing[2],     // 8
      backgroundColor: colors.surface,
    },
    btnOutlineText: {
      fontSize: fontSize.xs,           // 12
      fontWeight: fontWeight.semibold, // "600"
      color: colors.text,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],   // 12
      paddingVertical: spacing[2],     // 8
    },
    btnPrimaryText: {
      fontSize: fontSize.xs,           // 12
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },

    // ── States ───────────────────────────────────────────────────────────────
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    infoText: {
      textAlign: "center",
      fontSize: fontSize.sm,           // 14
      color: colors.muted,
      marginTop: spacing[8],           // 40
    },
    errorText: {
      textAlign: "center",
      fontSize: fontSize.xs,           // 12
      color: colors.error,
      marginTop: spacing[4],           // 16
    },

    // ── List ─────────────────────────────────────────────────────────────────
    list: {
      flex: 1,
    },
    listContent: {
      paddingBottom: spacing[7],       // 32
    },

    // ── Task card ────────────────────────────────────────────────────────────
    taskCard: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,         // 16
      padding: spacing[4],             // 16
      marginBottom: spacing[3],        // 12
    },
    taskCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing[2],                 // 8
      marginBottom: spacing[1],        // 4
    },
    taskTitle: {
      flex: 1,
      fontSize: fontSize.base,         // 16
      fontWeight: fontWeight.semibold, // "600"
      color: colors.textStrong,
    },
    pointsPill: {
      backgroundColor: colors.rewardSoft,
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],   // 8
      paddingVertical: 3,
    },
    pointsPillText: {
      fontSize: fontSize.xs,           // 12
      fontWeight: fontWeight.bold,     // "700"
      color: colors.reward,
    },
    proofBadge: {
      alignSelf: "flex-start",
      marginTop: spacing[2],           // 8
      backgroundColor: colors.infoSoft,
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],   // 8
      paddingVertical: 2,
    },
    proofBadgeText: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.info,
    },
  });
}

// ---------------------------------------------------------------------------
// TasksScreen
// ---------------------------------------------------------------------------

export function TasksScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { activeGroupId } = useAppSession();
  const { tasks, isLoading, error, reload } = useTasks(activeGroupId);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", reload);
    return unsubscribe;
  }, [navigation, reload]);

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.btnOutline, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.navigate("Approvals")}
        >
          <Text style={s.btnOutlineText}>Aprobaciones</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.btnPrimary, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate("CreateTask")}
        >
          <Text style={s.btnPrimaryText}>+ Nueva tarea</Text>
        </Pressable>
      </View>

      {/* Estados */}
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={{ marginTop: theme.spacing[4] }}
        />
      ) : null}
      {error ? <Text style={s.errorText}>{error}</Text> : null}
      {!isLoading && !error && tasks.length === 0 ? (
        <Text style={s.infoText}>No hay tareas activas en este grupo.</Text>
      ) : null}

      {/* Lista */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        style={s.list}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              s.taskCard,
              pressed && { opacity: 0.75 },
            ]}
            onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
          >
            <View style={s.taskCardHeader}>
              <Text style={s.taskTitle}>{item.title}</Text>
              <View style={s.pointsPill}>
                <Text style={s.pointsPillText}>{item.pointsValue} pts</Text>
              </View>
            </View>

            {item.requiresProof ? (
              <View style={s.proofBadge}>
                <Text style={s.proofBadgeText}>Requiere prueba</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}