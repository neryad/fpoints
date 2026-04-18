import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";

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

export function Badge({ label, variant = "default" }: BadgeProps) {
  const { colors, spacing, radius, fontSize, fontWeight } = useTheme();

  const bg: Record<BadgeVariant, string> = {
    default: colors.surfaceMuted,
    success: colors.successSoft,
    warning: colors.warningSoft,
    error:   colors.errorSoft,
    xp:      colors.xpSoft,
    streak:  colors.streakSoft,
    points:  colors.pointsSoft,
  };

  const fg: Record<BadgeVariant, string> = {
    default: colors.textSecondary,
    success: colors.success,
    warning: colors.warning,
    error:   colors.error,
    xp:      colors.xp,
    streak:  colors.streak,
    points:  colors.points,
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg[variant],
          borderRadius: radius.sm,
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[1],
        },
      ]}
    >
      <Text
        style={{
          color: fg[variant],
          fontSize: fontSize.xxs,
          fontWeight: fontWeight.semibold,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
  },
});
