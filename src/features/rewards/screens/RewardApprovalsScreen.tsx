import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import { getUserDisplayNames } from "../../tasks/services/tasks.service";
import {
  canManageRewards,
  listPendingRewardRedemptions,
  reviewRewardRedemption,
} from "../services/rewards.service";
import type { RewardRedemption } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "RewardApprovals">;

export function RewardApprovalsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { activeGroupId } = useAppSession();

  const [items, setItems] = useState<RewardRedemption[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dialog, setDialog] = useState<null | {
    title: string; message: string; confirmText: string;
    destructive?: boolean; onConfirm: () => void;
  }>(null);

  const loadData = useCallback(async () => {
    if (!activeGroupId) {
      setItems([]);
      setCanReview(false);
      setIsLoading(false);
      return;
    }
    try {
      setError("");
      setSuccessMessage("");
      setIsLoading(true);
      const manager = await canManageRewards(activeGroupId);
      setCanReview(manager);
      if (!manager) { setItems([]); return; }
      const data = await listPendingRewardRedemptions(activeGroupId);
      setItems(data);
      const labels = await getUserDisplayNames(data.map((item) => item.userId), activeGroupId);
      setUserDisplayNames(labels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los canjes pendientes.");
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  const handleReview = useCallback(
    (item: RewardRedemption, status: "approved" | "rejected") => {
      const label = status === "approved" ? "aprobar" : "rechazar";
      setDialog({
        title: "Confirmar",
        message: `¿Seguro que quieres ${label} este canje?`,
        confirmText: status === "approved" ? "Aprobar" : "Rechazar",
        destructive: status === "rejected",
        onConfirm: async () => {
          setDialog(null);
          try {
            setError("");
            setSuccessMessage("");
            setReviewingId(item.id);
            await reviewRewardRedemption(item.id, status);
            setSuccessMessage(
              status === "approved"
                ? "Canje aprobado y puntos descontados."
                : "Canje rechazado.",
            );
            await loadData();
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo revisar el canje.");
          } finally {
            setReviewingId(null);
          }
        },
      });
    },
    [loadData],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!canReview) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-sm text-muted-foreground text-center">
          Solo owner o sub_owner puede aprobar o rechazar canjes.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4">
      <ConfirmDialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmText={dialog?.confirmText ?? ""}
        destructive={dialog?.destructive}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />
      {error ? (
        <Text className="text-destructive text-xs text-center mb-3 font-sans">{error}</Text>
      ) : null}
      {successMessage ? (
        <Text className="text-success text-xs text-center mb-3 font-sans">{successMessage}</Text>
      ) : null}

      {items.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center mt-6">
          No hay canjes pendientes.
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => {
            const isBusy = reviewingId === item.id;
            const displayName = userDisplayNames[item.userId] ?? item.userId;
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
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-[11px] font-sans-medium text-muted-foreground w-[72px]">Solicitado</Text>
                  <Text className="flex-1 text-xs text-foreground">{displayName}</Text>
                </View>
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-[11px] font-sans-medium text-muted-foreground w-[72px]">Fecha</Text>
                  <Text className="flex-1 text-xs text-foreground">{date}</Text>
                </View>
                <View className="flex-row gap-2 mt-4">
                  <Pressable
                    className={`flex-1 bg-success rounded-xl py-3 items-center active:opacity-80 ${isBusy ? "opacity-40" : ""}`}
                    onPress={() => handleReview(item, "approved")}
                    disabled={isBusy}
                  >
                    <Text className="text-sm font-sans-bold text-primary-foreground">
                      {isBusy ? "..." : "Aprobar"}
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 bg-destructive/15 border border-destructive rounded-xl py-3 items-center active:opacity-80 ${isBusy ? "opacity-40" : ""}`}
                    onPress={() => handleReview(item, "rejected")}
                    disabled={isBusy}
                  >
                    <Text className="text-sm font-sans-bold text-destructive">
                      {isBusy ? "..." : "Rechazar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
