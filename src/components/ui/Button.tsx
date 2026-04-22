import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = true,
}: ButtonProps) {
  const { colors, spacing, radius, fontSize, fontWeight } = useTheme();

  const isDisabled = disabled || loading;

  const bgColor: Record<ButtonVariant, string> = {
    primary:   colors.primary,
    secondary: colors.surfaceMuted,
    danger:    colors.error,
    ghost:     "transparent",
    outline:   "transparent",
  };

  const textColor: Record<ButtonVariant, string> = {
    primary:   colors.textInverse,
    secondary: colors.textPrimary,
    danger:    colors.textInverse,
    ghost:     colors.primary,
    outline:   colors.primary,
  };

  const paddingV: Record<ButtonSize, number> = {
    sm: spacing[2],
    md: spacing[3],
    lg: spacing[4],
  };

  const textSize: Record<ButtonSize, number> = {
    sm: fontSize.xs,
    md: fontSize.sm,
    lg: fontSize.base,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor[variant],
          borderRadius: radius.md,
          paddingVertical: paddingV[size],
          paddingHorizontal: spacing[4],
          borderWidth: variant === "outline" ? 0.5 : 0,
          borderColor: variant === "outline" ? colors.primary : "transparent",
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: isDisabled ? 0.5 : pressed ? 0.78 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={textColor[variant]}
          />
        ) : (
          <Text
            style={{
              color: textColor[variant],
              fontSize: textSize[size],
              fontWeight: fontWeight.bold,
              textAlign: "center",
            }}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
