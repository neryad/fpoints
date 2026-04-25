import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";

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

const variantClass: Record<ButtonVariant, string> = {
  primary:   "bg-primary",
  secondary: "bg-secondary",
  danger:    "bg-destructive",
  ghost:     "bg-transparent",
  outline:   "bg-transparent border border-primary",
};

const textClass: Record<ButtonVariant, string> = {
  primary:   "text-primary-foreground",
  secondary: "text-secondary-foreground",
  danger:    "text-destructive-foreground",
  ghost:     "text-primary",
  outline:   "text-primary",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-5 py-4",
};

const sizeTextClass: Record<ButtonSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
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
  const { colorScheme } = useColorScheme();
  const isDisabled = disabled || loading;
  const spinnerColor = (variant === "primary" || variant === "danger")
    ? "#FFFFFF"
    : colorScheme === "dark" ? "#E0DDD8" : "#1B1E26";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={[
        "items-center justify-center rounded-xl active:opacity-75",
        variantClass[variant],
        sizeClass[size],
        fullWidth ? "self-stretch" : "self-start",
        isDisabled ? "opacity-50" : "",
      ].join(" ")}
    >
      <View className="flex-row items-center gap-2">
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : (
          <Text className={["font-sans-bold", textClass[variant], sizeTextClass[size]].join(" ")}>
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
