import React from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { shadows } from "../tokens/shadows";

export interface RewardCardProps {
  title: string;
  cost: number;
  description?: string;
  icon?: React.ReactNode;
  available?: boolean;
  userPoints?: number;
  onRedeem?: () => void;
  style?: ViewStyle;
}

export function RewardCard({
  title,
  cost,
  description,
  icon,
  available = true,
  userPoints = 0,
  onRedeem,
  style,
}: RewardCardProps) {
  const canRedeem = userPoints >= cost && available;
  const defaultIcon = (
    <View className="h-9 w-9 items-center justify-center rounded-full bg-points/15">
      <Ionicons name="gift-outline" size={20} color="hsl(8, 85%, 60%)" />
    </View>
  );

  return (
    <View
      style={[shadows.card, style, !available && { opacity: 0.5 }]}
      className="flex-col rounded-xl border border-border bg-card p-4"
    >
      <View className="flex-row items-start gap-3">
        {icon ?? defaultIcon}
        <View className="flex-1">
          <Text className="font-sans-semibold text-sm text-foreground">{title}</Text>
          {description ? (
            <Text className="mt-0.5 font-sans text-xs text-muted-foreground">
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
        <Text
          className="font-mono-bold text-xs text-points"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {cost} pts
        </Text>
        <Pressable
          onPress={canRedeem ? onRedeem : undefined}
          disabled={!canRedeem}
          className={[
            "rounded-full px-3 py-1",
            canRedeem ? "bg-primary active:opacity-80" : "bg-muted",
          ].join(" ")}
        >
          <Text
            className={[
              "font-sans-semibold text-xs",
              canRedeem ? "text-primary-foreground" : "text-muted-foreground",
            ].join(" ")}
          >
            {canRedeem ? "Canjear" : "Faltan puntos"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default RewardCard;