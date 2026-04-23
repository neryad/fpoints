import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { listMyRewardRedemptions } from "../services/rewards.service";
import type { RewardRedemption } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "MyRedemptions">;

function getStatusClasses(status: string) {
  const map: Record<string, { label: string; dot: string; text: string }> = {
    pending:  { label: "Pendiente", dot: "bg-warning",     text: "text-warning" },
    approved: { label: "Aprobado",  dot: "bg-success",     text: "text-success" },
    rejected: { label: "Rechazado", dot: "bg-destructive", text: "text-destructive" },
  };
  return map[status] ?? { label: status, dot: "bg-muted-foreground", text: "text-muted-foreground" };
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
      setError(err instanceof Error ? err.message : "No se pudo cargar tus canjes.");
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
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4">
      {error ? (
        <Text className="text-destructive text-xs text-center mb-3 font-sans">{error}</Text>
      ) : null}

      {items.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center mt-6">
          Aún no tienes solicitudes de canje.
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => {
            const status = getStatusClasses(item.status);
            const date = new Date(item.createdAt).toLocaleString();

            return (
              <View className="bg-card border border-border rounded-xl p-4 mb-3">
                <View className="flex-row justify-between items-start gap-2 mb-3">
                  <Text className="flex-1 text-base font-sans-semibold text-foreground">
                    {item.rewardTitle}
                  </Text>
                  <View className="bg-points/15 rounded-full px-2" style={{ paddingVertical: 3 }}>
                    <Text className="text-xs font-sans-bold text-points">{item.rewardCostPoints} pts</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-[11px] font-sans-medium text-muted-foreground w-12">Estado</Text>
                  <View className="flex-row items-center gap-1">
                    <View className={`w-[7px] h-[7px] rounded-full ${status.dot}`} />
                    <Text className={`text-xs font-sans-semibold ${status.text}`}>{status.label}</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2">
                  <Text className="text-[11px] font-sans-medium text-muted-foreground w-12">Fecha</Text>
                  <Text className="flex-1 text-xs text-foreground">{date}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
