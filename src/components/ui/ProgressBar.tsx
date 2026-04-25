import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";

export type ProgressBarVariant = "xp" | "points" | "default";

export type ProgressBarProps = {
  /** Value between 0 and 1 */
  progress: number;
  variant?: ProgressBarVariant;
  showLabel?: boolean;
  height?: number;
};

export function ProgressBar({
  progress,
  variant = "default",
  showLabel = false,
  height = 8,
}: ProgressBarProps) {
  const { colors, radius, fontSize, fontWeight, spacing } = useTheme();

  const clamped = Math.min(1, Math.max(0, progress));
  const pct = Math.round(clamped * 100);

  const fillColor: Record<ProgressBarVariant, string> = {
    xp:      colors.xp,
    points:  colors.points,
    default: colors.primary,
  };

  const trackColor: Record<ProgressBarVariant, string> = {
    xp:      colors.xpSoft,
    points:  colors.pointsSoft,
    default: colors.surfaceMuted,
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.track,
          {
            height,
            borderRadius: radius.full,
            backgroundColor: trackColor[variant],
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              height,
              borderRadius: radius.full,
              backgroundColor: fillColor[variant],
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: fontSize.xxs,
            fontWeight: fontWeight.medium,
            marginTop: spacing[1],
            alignSelf: "flex-end",
          }}
        >
          {pct}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
  },
});
