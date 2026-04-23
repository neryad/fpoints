import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../core/theme/ThemeProvider";
import { shadows } from "../../../design-system-rn/tokens/shadows";

export type StatCardColor = "streak" | "points" | "xp" | "tasks" | "reward";

export type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color?: StatCardColor;
  style?: ViewStyle;
};

const colorClasses: Record<StatCardColor, { value: string; icon: string; border: string; iconColor: string }> = {
  streak: { value: "text-streak",  icon: "bg-streak/15",  border: "border-t-streak",  iconColor: "streak" },
  points: { value: "text-points",  icon: "bg-points/15",  border: "border-t-points",  iconColor: "points" },
  xp:     { value: "text-xp",      icon: "bg-xp/15",      border: "border-t-xp",      iconColor: "xp" },
  tasks:  { value: "text-success", icon: "bg-success/15", border: "border-t-success", iconColor: "success" },
  reward: { value: "text-points",  icon: "bg-points/15",  border: "border-t-points",  iconColor: "points" },
};

const iconColorMap: Record<string, (colors: ReturnType<typeof useTheme>["colors"]) => string> = {
  streak:  (c) => c.streak  ?? c.warning,
  points:  (c) => c.reward  ?? c.primary,
  xp:      (c) => (c as Record<string, string>).xp ?? c.primary,
  success: (c) => c.success,
};

export function StatCard({ icon, value, label, color = "points", style }: StatCardProps) {
  const { colors } = useTheme();
  const c = colorClasses[color];
  const iconColor = iconColorMap[c.iconColor]?.(colors) ?? colors.primary;

  return (
    <View
      style={[shadows.card, style]}
      className={["flex-1 rounded-xl border border-border bg-card p-4 border-t-2", c.border].join(" ")}
    >
      <View className={["h-10 w-10 items-center justify-center rounded-xl mb-2", c.icon].join(" ")}>
        <Ionicons name={icon} size={20} color={iconColor} />
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
