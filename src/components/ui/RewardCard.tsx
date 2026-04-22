import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../core/theme/ThemeProvider";
import { ProgressBar } from "./ProgressBar";
import type { Reward } from "../../features/rewards/types";

export type RewardCardProps = {
  reward: Reward;
  userPoints: number;
  onRedeem: () => void;
};

export function RewardCard({ reward, userPoints, onRedeem }: RewardCardProps) {
  const { colors, spacing, radius, fontSize, fontWeight, shadow } = useTheme();

  const canAfford = userPoints >= reward.costPoints;
  const progress  = Math.min(1, userPoints / reward.costPoints);
  const missing   = reward.costPoints - userPoints;

  return (
    <View
      style={[
        styles.card,
        shadow.level1,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing[4],
          opacity: reward.active ? 1 : 0.5,
        },
      ]}
    >
      <View style={[styles.header, { gap: spacing[3] }]}>
        <View style={styles.info}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: fontSize.sm,
              fontWeight: fontWeight.semibold,
            }}
            numberOfLines={1}
          >
            {reward.title}
          </Text>
          <View style={[styles.inlineRow, { marginTop: spacing[1] }]}>
            <Ionicons name="star" size={12} color={colors.points} />
            <Text style={{ color: colors.points, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>
              {reward.costPoints} pts
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onRedeem}
          disabled={!canAfford || !reward.active}
          style={({ pressed }) => [
            styles.redeemBtn,
            {
              backgroundColor: canAfford ? colors.primary : colors.surfaceMuted,
              borderRadius: radius.md,
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text
            style={{
              color: canAfford ? colors.textInverse : colors.muted,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.bold,
            }}
          >
            Canjear
          </Text>
        </Pressable>
      </View>

      {!canAfford && (
        <View style={{ marginTop: spacing[3], gap: spacing[1] }}>
          <ProgressBar progress={progress} variant="points" />
          <View style={[styles.missingRow, { gap: spacing[1] }]}>
            <Ionicons name="lock-closed-outline" size={12} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: fontSize.xxs }}>
              Te faltan {missing} pts
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  redeemBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  missingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});
