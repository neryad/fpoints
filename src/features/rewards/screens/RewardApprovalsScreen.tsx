import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import shadows from "../../../../design-system-rn/tokens/shadows";
import { Button, GameBadge } from "../../../../design-system-rn/components";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RewardApprovalsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { activeGroupId } = useAppSession();

  const [items, setItems] = useState<RewardRedemption[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [userDisplayNames, setUserDisplayNames] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dialog, setDialog] = useState<null | {
    title: string;
    message: string;
    confirmText: string;
    destructive?: boolean;
    onConfirm: () => void;
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
      if (!manager) {
        setItems([]);
        return;
      }
      const data = await listPendingRewardRedemptions(activeGroupId);
      setItems(data);
      const labels = await getUserDisplayNames(
        data.map((item) => item.userId),
        activeGroupId,
      );
      setUserDisplayNames(labels);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los canjes pendientes.",
      );
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
            setError(
              err instanceof Error ? err.message : "No se pudo revisar el canje.",
            );
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
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!canReview) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Ionicons name="lock-closed-outline" size={26} color={colors.muted} />
          </View>
          <Text className="text-center font-sans text-sm text-muted-foreground">
            Solo owner o sub_owner puede aprobar o rechazar canjes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ConfirmDialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmText={dialog?.confirmText ?? ""}
        destructive={dialog?.destructive}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />

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
            {successMessage ? (
              <View className="mb-3 rounded-xl border border-success/30 bg-success/10 p-3">
                <Text className="text-center font-sans-medium text-sm text-success">
                  {successMessage}
                </Text>
              </View>
            ) : null}
            {items.length > 0 ? (
              <Text className="mb-3 font-sans text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? "canje pendiente" : "canjes pendientes"}
              </Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !error ? (
            <View className="items-center px-6 py-16">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Ionicons
                  name="checkmark-done-outline"
                  size={32}
                  color={colors.muted}
                />
              </View>
              <Text className="text-center font-sans-semibold text-base text-foreground">
                Todo al día
              </Text>
              <Text className="mt-1 text-center font-sans text-sm text-muted-foreground">
                No hay canjes pendientes de revisión.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isBusy = reviewingId === item.id;
          const displayName = userDisplayNames[item.userId] ?? item.userId;
          const initials = getInitials(displayName);

          return (
            <View
              style={shadows.card}
              className="mb-3 rounded-2xl border border-border bg-card p-4"
            >
              {/* Header: premio + costo */}
              <View className="mb-3 flex-row items-start justify-between gap-2">
                <Text
                  className="flex-1 font-sans-semibold text-base text-foreground"
                  numberOfLines={2}
                >
                  {item.rewardTitle}
                </Text>
                <GameBadge
                  type="points"
                  value={`${item.rewardCostPoints} pts`}
                  size="sm"
                />
              </View>

              {/* Solicitante */}
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                  <Text className="font-sans-bold text-[11px] text-primary">
                    {initials}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="font-sans-medium text-sm text-foreground"
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  <Text className="font-sans text-[11px] text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Acciones */}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label={isBusy ? "..." : "Aprobar"}
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={isBusy}
                    onPress={() => handleReview(item, "approved")}
                    iconLeft={
                      isBusy ? undefined : (
                        <Ionicons
                          name="checkmark"
                          size={15}
                          color={colors.primaryText}
                        />
                      )
                    }
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label={isBusy ? "..." : "Rechazar"}
                    variant="destructive"
                    size="md"
                    fullWidth
                    disabled={isBusy}
                    onPress={() => handleReview(item, "rejected")}
                    iconLeft={
                      isBusy ? undefined : (
                        <Ionicons name="close" size={15} color="#fff" />
                      )
                    }
                  />
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
