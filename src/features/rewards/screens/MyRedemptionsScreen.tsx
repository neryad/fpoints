import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import shadows from "../../../../design-system-rn/tokens/shadows";
import { GameBadge } from "../../../../design-system-rn/components";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { listMyRewardRedemptions } from "../services/rewards.service";
import type { RewardRedemption, RewardRedemptionStatus } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "MyRedemptions">;

const STATUS_CONFIG: Record<
  RewardRedemptionStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  pending: {
    label: "Pendiente",
    dot: "bg-warning",
    text: "text-warning",
    bg: "bg-warning/10",
  },
  approved: {
    label: "Aprobado",
    dot: "bg-success",
    text: "text-success",
    bg: "bg-success/10",
  },
  rejected: {
    label: "Rechazado",
    dot: "bg-destructive",
    text: "text-destructive",
    bg: "bg-destructive/10",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RedemptionRow({ item }: { item: RewardRedemption }) {
  const status =
    STATUS_CONFIG[item.status] ?? {
      label: item.status,
      dot: "bg-muted",
      text: "text-muted-foreground",
      bg: "bg-muted",
    };

  return (
    <View
      style={shadows.card}
      className="mb-3 rounded-2xl border border-border bg-card p-4"
    >
      <View className="mb-3 flex-row items-start justify-between gap-2">
        <Text
          className="flex-1 font-sans-semibold text-base text-foreground"
          numberOfLines={2}
        >
          {item.rewardTitle}
        </Text>
        <GameBadge type="points" value={`${item.rewardCostPoints} pts`} size="sm" />
      </View>

      <View className="flex-row items-center justify-between">
        <View className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${status.bg}`}>
          <View className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          <Text className={`font-sans-semibold text-xs ${status.text}`}>
            {status.label}
          </Text>
        </View>
        <Text className="font-sans text-[11px] text-muted-foreground">
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export function MyRedemptionsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { activeGroupId } = useAppSession();

  const [items, setItems] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!activeGroupId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    try {
      setError("");
      setIsLoading(true);
      const data = await listMyRewardRedemptions(activeGroupId);
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar tus canjes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {error ? (
              <View className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                <Text className="text-center font-sans-medium text-sm text-destructive">
                  {error}
                </Text>
              </View>
            ) : null}
            {items.length > 0 ? (
              <Text className="mb-3 font-sans text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? "solicitud" : "solicitudes"}
              </Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View className="items-center px-6 py-16">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Ionicons
                  name="receipt-outline"
                  size={32}
                  color={colors.muted}
                />
              </View>
              <Text className="text-center font-sans-semibold text-base text-foreground">
                Sin solicitudes aún
              </Text>
              <Text className="mt-1 text-center font-sans text-sm text-muted-foreground">
                Cuando canjees un premio aparecerá aquí con su estado.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <RedemptionRow item={item} />}
      />
    </SafeAreaView>
  );
}
