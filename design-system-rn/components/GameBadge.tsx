import React from "react";
import { Text, View, ViewStyle } from "react-native";

type BadgeType = "xp" | "streak" | "points" | "level";
type BadgeSize = "sm" | "default" | "lg";

export interface GameBadgeProps {
  type?: BadgeType;
  size?: BadgeSize;
  icon?: React.ReactNode;
  value: number | string;
  label?: string;
  style?: ViewStyle;
}

const wrapperByType: Record<BadgeType, string> = {
  xp: "bg-xp/15 border-xp/20",
  streak: "bg-streak/15 border-streak/20",
  points: "bg-points/15 border-points/20",
  level: "bg-primary/15 border-primary/20",
};

const textByType: Record<BadgeType, string> = {
  xp: "text-xp",
  streak: "text-streak",
  points: "text-points",
  level: "text-primary",
};

const sizePadding: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5",
  default: "px-3 py-1",
  lg: "px-4 py-1.5",
};

const sizeText: Record<BadgeSize, string> = {
  sm: "text-[10px]",
  default: "text-xs",
  lg: "text-sm",
};

export function GameBadge({
  type = "points",
  size = "default",
  icon,
  value,
  label,
  style,
}: GameBadgeProps) {
  const isStreakOff = type === "streak" && Number(value) === 0;

  return (
    <View
      style={style}
      className={[
        "flex-row items-center rounded-full border",
        wrapperByType[type],
        sizePadding[size],
        isStreakOff ? "opacity-40" : "",
      ].join(" ")}
    >
      {icon ? <View className="mr-1.5">{icon}</View> : null}
      <Text className={["font-mono-bold", sizeText[size], textByType[type]].join(" ")}>
        {value}
      </Text>
      {label ? (
        <Text
          className={[
            "ml-1 font-sans-medium opacity-70",
            sizeText[size],
            textByType[type],
          ].join(" ")}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export default GameBadge;