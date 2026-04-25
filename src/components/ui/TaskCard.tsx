import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { shadows } from "../../../design-system-rn/tokens/shadows";
import type { Task, TaskSubmissionStatus } from "../../features/tasks/types";

export type TaskCardProps = {
  task: Task;
  submissionStatus?: TaskSubmissionStatus | null;
  assigneeName?: string | null;
  onPress: () => void;
  onComplete?: () => void;
};

const submissionConfig: Record<
  TaskSubmissionStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending:  { label: "Enviada",    bg: "bg-xp/15",          text: "text-xp",          border: "border-xp/20" },
  approved: { label: "Aprobada",   bg: "bg-success/15",     text: "text-success",     border: "border-success/20" },
  rejected: { label: "Rechazada",  bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/20" },
};

const availableBadge = { label: "Disponible", bg: "bg-secondary", text: "text-secondary-foreground", border: "border-transparent" };

export function TaskCard({ task, submissionStatus, assigneeName, onPress, onComplete }: TaskCardProps) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#808790" : "#737980";

  const isApproved = submissionStatus === "approved";
  const isPending  = submissionStatus === "pending";
  const badge      = submissionStatus ? submissionConfig[submissionStatus] : availableBadge;

  return (
    <Pressable
      onPress={onPress}
      style={shadows.card}
      className="flex-row items-start gap-3 rounded-xl border border-border bg-card p-4 active:opacity-80"
    >
      <View
        className={[
          "mt-0.5 h-5 w-5 items-center justify-center rounded-full border-2",
          isApproved ? "border-success bg-success" : "border-border",
        ].join(" ")}
      >
        {isApproved ? (
          <Text className="font-sans-bold text-[10px] text-success-foreground">✓</Text>
        ) : null}
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            numberOfLines={2}
            className={[
              "flex-1 font-sans-medium text-sm",
              isApproved ? "text-muted-foreground line-through" : "text-foreground",
            ].join(" ")}
          >
            {task.title}
          </Text>

          <View className="flex-row items-center gap-2">
            <Text
              className="font-mono-bold text-xs text-points"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              +{task.pointsValue} pts
            </Text>

            {onComplete && !isApproved && !isPending && (
              <Pressable
                onPress={onComplete}
                hitSlop={8}
                className="h-7 w-7 items-center justify-center rounded-full border border-border active:opacity-60"
              >
                <Ionicons name="checkmark" size={14} color={iconColor} />
              </Pressable>
            )}
          </View>
        </View>

        <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
          <View className={["rounded-full border px-2 py-0.5", badge.bg, badge.border].join(" ")}>
            <Text className={["font-sans-semibold text-[10px]", badge.text].join(" ")}>
              {badge.label}
            </Text>
          </View>

          {task.requiresProof ? (
            <View className="flex-row items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
              <Ionicons name="camera-outline" size={10} color={iconColor} />
              <Text className="font-sans-medium text-[10px] text-secondary-foreground">
                Evidencia
              </Text>
            </View>
          ) : null}
        </View>

        {assigneeName ? (
          <Text className="mt-1.5 font-sans text-[11px] text-muted-foreground">
            👤 {assigneeName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
