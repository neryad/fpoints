import React from "react";
import { Text, View, ViewStyle } from "react-native";
import { shadows } from "../tokens/shadows";

type Trend = "up" | "down" | "neutral";

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: Trend;
  /** Tailwind color class for value/icon (e.g. "text-points"). */
  colorClass?: string;
  style?: ViewStyle;
}

const trendStyles: Record<Trend, { bg: string; text: string; symbol: string }> = {
  up: { bg: "bg-success/15", text: "text-success", symbol: "↑" },
  down: { bg: "bg-destructive/15", text: "text-destructive", symbol: "↓" },
  neutral: { bg: "bg-muted", text: "text-muted-foreground", symbol: "—" },
};

export function StatCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  colorClass = "text-primary",
  style,
}: StatCardProps) {
  const t = trend ? trendStyles[trend] : null;
  return (
    <View
      style={[shadows.card, style]}
      className="flex-col rounded-xl border border-border bg-card p-4"
    >
      <View className="flex-row items-center justify-between">
        <Text className={["text-lg", colorClass].join(" ")}>{icon}</Text>
        {t ? (
          <View className={["rounded-full px-1.5 py-0.5", t.bg].join(" ")}>
            <Text className={["font-mono-bold text-[10px]", t.text].join(" ")}>
              {t.symbol}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-2">
        <Text
          className={["font-mono-bold text-2xl", colorClass].join(" ")}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {value}
        </Text>
        <Text className="mt-0.5 font-sans text-xs text-muted-foreground">
          {label}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 font-sans text-[10px] text-muted-foreground/70">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default StatCard;