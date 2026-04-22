import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { shadows } from "../../../design-system-rn/tokens/shadows";
import { ProgressBar } from "./ProgressBar";
import type { Reward } from "../../features/rewards/types";

export type RewardCardProps = {
  reward: Reward;
  userPoints: number;
  onRedeem: () => void;
};

export function RewardCard({ reward, userPoints, onRedeem }: RewardCardProps) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#808790" : "#737980";

  const canAfford = userPoints >= reward.costPoints;
  const progress  = Math.min(1, userPoints / reward.costPoints);
  const missing   = reward.costPoints - userPoints;

  return (
    <View
      style={[shadows.card, !reward.active && { opacity: 0.5 }]}
      className="rounded-xl border border-border bg-card p-4"
    >
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="font-sans-semibold text-sm text-foreground" numberOfLines={1}>
            {reward.title}
          </Text>
          <Text
            className="mt-0.5 font-mono-bold text-xs text-points"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {reward.costPoints} pts
          </Text>
        </View>

        <Pressable
          onPress={onRedeem}
          disabled={!canAfford || !reward.active}
          className={[
            "rounded-full px-3 py-2 active:opacity-75",
            canAfford && reward.active ? "bg-primary" : "bg-muted",
          ].join(" ")}
        >
          <Text
            className={[
              "font-sans-bold text-xs",
              canAfford && reward.active ? "text-primary-foreground" : "text-muted-foreground",
            ].join(" ")}
          >
            Canjear
          </Text>
        </Pressable>
      </View>

      {!canAfford && (
        <View className="mt-3 gap-1.5">
          <ProgressBar progress={progress} variant="points" />
          <View className="flex-row items-center gap-1">
            <Ionicons name="lock-closed-outline" size={11} color={iconColor} />
            <Text className="font-sans text-[10px] text-muted-foreground">
              Te faltan {missing} pts
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
