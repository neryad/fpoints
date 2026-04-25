import React from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";
import { shadows } from "../tokens/shadows";

export type TaskStatus = "pending" | "submitted" | "approved" | "rejected";

export interface TaskCardProps {
  title: string;
  points: number;
  assignee?: string;
  status?: TaskStatus;
  dueLabel?: string;
  category?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: { label: "Pendiente", bg: "bg-warning/15", text: "text-warning", border: "border-warning/20" },
  submitted: { label: "Enviada", bg: "bg-xp/15", text: "text-xp", border: "border-xp/20" },
  approved: { label: "Aprobada", bg: "bg-success/15", text: "text-success", border: "border-success/20" },
  rejected: { label: "Rechazada", bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/20" },
};

export function TaskCard({
  title,
  points,
  assignee,
  status = "pending",
  dueLabel,
  category,
  onPress,
  style,
}: TaskCardProps) {
  const s = statusConfig[status];
  const isApproved = status === "approved";

  return (
    <Pressable
      onPress={onPress}
      style={[shadows.card, style]}
      className="flex-row items-start gap-3 rounded-xl border border-border bg-card p-4 active:opacity-80"
    >
      <View
        className={[
          "mt-0.5 h-5 w-5 items-center justify-center rounded-full border-2",
          isApproved ? "bg-success border-success" : "border-border",
        ].join(" ")}
      >
        {isApproved ? (
          <Text className="font-sans-bold text-[10px] text-success-foreground">✓</Text>
        ) : null}
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className={[
              "flex-1 font-sans-medium text-sm",
              isApproved ? "text-muted-foreground line-through" : "text-foreground",
            ].join(" ")}
          >
            {title}
          </Text>
          <Text
            className="font-mono-bold text-xs text-points"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            +{points} pts
          </Text>
        </View>

        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          <View className={["rounded-full border px-2 py-0.5", s.bg, s.border].join(" ")}>
            <Text className={["font-sans-semibold text-[10px]", s.text].join(" ")}>
              {s.label}
            </Text>
          </View>

          {category ? (
            <View className="rounded-full bg-secondary px-2 py-0.5">
              <Text className="font-sans-medium text-[10px] text-secondary-foreground">
                {category}
              </Text>
            </View>
          ) : null}

          {dueLabel ? (
            <Text className="font-sans text-[10px] text-muted-foreground">
              {dueLabel}
            </Text>
          ) : null}
        </View>

        {assignee ? (
          <Text className="mt-1.5 font-sans text-[11px] text-muted-foreground">
            👤 {assignee}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default TaskCard;