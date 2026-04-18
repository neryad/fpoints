import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../core/theme/ThemeProvider";
import type { Task, TaskSubmissionStatus } from "../../features/tasks/types";

export type TaskCardProps = {
  task: Task;
  submissionStatus?: TaskSubmissionStatus | null;
  onPress: () => void;
  onComplete?: () => void;
};

export function TaskCard({
  task,
  submissionStatus,
  onPress,
  onComplete,
}: TaskCardProps) {
  const { colors, spacing, radius, fontSize, fontWeight, shadow } = useTheme();

  const isDone = submissionStatus === "approved";
  const isPending = submissionStatus === "pending";

  const statusColor = isDone
    ? colors.success
    : isPending
    ? colors.warning
    : colors.border;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadow.level1,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing[4],
          borderLeftWidth: 4,
          borderLeftColor: statusColor,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text
            style={[
              {
                color: isDone ? colors.muted : colors.textPrimary,
                fontSize: fontSize.sm,
                fontWeight: fontWeight.semibold,
              },
              isDone && styles.strikethrough,
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>

          <View style={[styles.meta, { marginTop: spacing[1] }]}>
            <Text style={{ color: colors.points, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>
              ⭐ {task.pointsValue} pts
            </Text>
            {task.requiresProof && (
              <View style={[styles.pill, { backgroundColor: colors.infoSoft, borderRadius: radius.sm, paddingHorizontal: spacing[2] }]}>
                <Text style={{ color: colors.info, fontSize: fontSize.xxs, fontWeight: fontWeight.medium }}>
                  📷 Evidencia
                </Text>
              </View>
            )}
          </View>
        </View>

        {onComplete && !isDone && !isPending && (
          <Pressable
            onPress={onComplete}
            hitSlop={8}
            style={({ pressed }) => [
              styles.checkBtn,
              {
                borderColor: colors.border,
                borderRadius: radius.full,
                width: 36,
                height: 36,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="checkmark" size={18} color={colors.muted} />
          </Pressable>
        )}

        {isDone && (
          <View style={[styles.checkBtn, { backgroundColor: colors.successSoft, borderRadius: radius.full, width: 36, height: 36 }]}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          </View>
        )}

        {isPending && (
          <View style={[styles.checkBtn, { backgroundColor: colors.warningSoft, borderRadius: radius.full, width: 36, height: 36 }]}>
            <Ionicons name="time-outline" size={20} color={colors.warning} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  info: {
    flex: 1,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    paddingVertical: 2,
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  checkBtn: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
});
