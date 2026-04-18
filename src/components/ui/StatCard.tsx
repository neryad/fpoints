import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";

export type StatCardColor = "streak" | "points" | "xp" | "tasks" | "reward";

export type StatCardProps = {
  emoji: string;
  value: string | number;
  label: string;
  color?: StatCardColor;
};

export function StatCard({ emoji, value, label, color = "points" }: StatCardProps) {
  const { colors, spacing, radius, fontSize, fontWeight, shadow } = useTheme();

  const accentColor: Record<StatCardColor, string> = {
    streak: colors.streak,
    points: colors.points,
    xp:     colors.xp,
    tasks:  colors.success,
    reward: colors.reward,
  };

  const softColor: Record<StatCardColor, string> = {
    streak: colors.streakSoft,
    points: colors.pointsSoft,
    xp:     colors.xpSoft,
    tasks:  colors.successSoft,
    reward: colors.rewardSoft,
  };

  const accent = accentColor[color];
  const soft   = softColor[color];

  return (
    <View
      style={[
        styles.card,
        shadow.level1,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing[4],
          borderTopWidth: 3,
          borderTopColor: accent,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: soft,
            borderRadius: radius.md,
            width: 40,
            height: 40,
            marginBottom: spacing[2],
          },
        ]}
      >
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: fontSize.xl,
          fontWeight: fontWeight.bold,
          lineHeight: 28,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
          marginTop: spacing[1],
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 90,
  },
  iconWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
});
