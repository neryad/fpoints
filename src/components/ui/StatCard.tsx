import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import { shadows } from "../../../design-system-rn/tokens/shadows";

export type StatCardColor = "streak" | "points" | "xp" | "tasks" | "reward";

export type StatCardProps = {
  emoji: string;
  value: string | number;
  label: string;
  color?: StatCardColor;
  style?: ViewStyle;
};

const colorClasses: Record<StatCardColor, { value: string; icon: string; border: string }> = {
  streak: { value: "text-streak",  icon: "bg-streak/15",  border: "border-t-streak" },
  points: { value: "text-points",  icon: "bg-points/15",  border: "border-t-points" },
  xp:     { value: "text-xp",      icon: "bg-xp/15",      border: "border-t-xp" },
  tasks:  { value: "text-success", icon: "bg-success/15", border: "border-t-success" },
  reward: { value: "text-points",  icon: "bg-points/15",  border: "border-t-points" },
};

export function StatCard({ emoji, value, label, color = "points", style }: StatCardProps) {
  const c = colorClasses[color];

  return (
    <View
      style={[shadows.card, style]}
      className={["flex-1 rounded-xl border border-border bg-card p-4 border-t-2", c.border].join(" ")}
    >
      <View className={["h-10 w-10 items-center justify-center rounded-xl mb-2", c.icon].join(" ")}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>

      <Text
        className={["font-mono-bold text-2xl", c.value].join(" ")}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
      <Text className="mt-0.5 font-sans text-xs text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}
