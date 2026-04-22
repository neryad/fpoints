import React from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
}

const baseClass =
  "flex-row items-center justify-center rounded-full active:opacity-80";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  outline: "bg-transparent border border-border",
  ghost: "bg-transparent",
  destructive: "bg-destructive",
};

const variantTextClass: Record<Variant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-destructive-foreground",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2.5",
  lg: "px-6 py-3.5",
};

const sizeTextClass: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  fullWidth,
  iconLeft,
  iconRight,
  style,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={style}
      className={[
        baseClass,
        variantClass[variant],
        sizeClass[size],
        fullWidth ? "w-full" : "",
        disabled ? "opacity-50" : "",
      ].join(" ")}
    >
      {iconLeft ? <View className="mr-2">{iconLeft}</View> : null}
      <Text
        className={[
          "font-sans-semibold",
          variantTextClass[variant],
          sizeTextClass[size],
        ].join(" ")}
      >
        {label}
      </Text>
      {iconRight ? <View className="ml-2">{iconRight}</View> : null}
    </Pressable>
  );
}

export default Button;