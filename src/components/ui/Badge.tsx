import React from "react";
import { Text, View } from "react-native";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "xp"
  | "streak"
  | "points";

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

const bgClass: Record<BadgeVariant, string> = {
  default: "bg-secondary",
  success: "bg-success/15",
  warning: "bg-warning/15",
  error:   "bg-destructive/15",
  xp:      "bg-xp/15",
  streak:  "bg-streak/15",
  points:  "bg-points/15",
};

const borderClass: Record<BadgeVariant, string> = {
  default: "border-border",
  success: "border-success/20",
  warning: "border-warning/20",
  error:   "border-destructive/20",
  xp:      "border-xp/20",
  streak:  "border-streak/20",
  points:  "border-points/20",
};

const textClass: Record<BadgeVariant, string> = {
  default: "text-secondary-foreground",
  success: "text-success",
  warning: "text-warning",
  error:   "text-destructive",
  xp:      "text-xp",
  streak:  "text-streak",
  points:  "text-points",
};

export function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <View
      className={[
        "self-start rounded-full border px-2 py-0.5",
        bgClass[variant],
        borderClass[variant],
      ].join(" ")}
    >
      <Text className={["font-sans-semibold text-[10px]", textClass[variant]].join(" ")}>
        {label}
      </Text>
    </View>
  );
}
