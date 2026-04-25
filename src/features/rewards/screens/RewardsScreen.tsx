import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import shadows from "../../../../design-system-rn/tokens/shadows";
import {
  Button,
  RewardCard,
} from "../../../../design-system-rn/components";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import { getMyPointsBalance } from "../../home/services/points.service";
import {
  canManageRewards,
  listGroupRewards,
  requestRewardRedemption,
} from "../services/rewards.service";
import type { Reward } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "RewardsList">;

export function RewardsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { activeGroupId } = useAppSession();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myPoints, setMyPoints] = useState(0);
  const [isManager, setIsManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      setRewards([]);
      setMyPoints(0);
      setIsManager(false);
      setIsLoading(false);
      return;
    }
    try {
      setError("");
      setSuccessMessage("");
      setIsLoading(true);
      const [canManage, balance] = await Promise.all([
        canManageRewards(activeGroupId),
        getMyPointsBalance(activeGroupId),
      ]);
      const rewardsData = await listGroupRewards(activeGroupId, canManage);
      setIsManager(canManage);
      setMyPoints(balance);
      setRewards(rewardsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los premios.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const handleRedeem = useCallback(
    (reward: Reward) => {
      if (!activeGroupId) return;
      setDialog({
        title: "Confirmar canje",
        message: `¿Solicitar canje de "${reward.title}" por ${reward.costPoints} puntos?`,
        confirmText: "Solicitar",
        onConfirm: async () => {
          setDialog(null);
          try {
            setError("");
            setSuccessMessage("");
            await requestRewardRedemption(activeGroupId, reward);
            setSuccessMessage("Solicitud enviada. Esperando aprobación.");
            await loadData();
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "No se pudo solicitar el canje.",
            );
          }
        },
      });
    },
    [activeGroupId, loadData],
  );

  const availableCount = rewards.filter(
    (r) => r.active && myPoints >= r.costPoints,
  ).length;

  const renderReward = useCallback(
    ({ item }: { item: Reward }) => (
      <RewardCard
        title={item.title}
        cost={item.costPoints}
        available={item.active}
        userPoints={myPoints}
        onRedeem={() => handleRedeem(item)}
      />
    ),
    [myPoints, handleRedeem],
  );

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
        data={isLoading ? [] : rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={renderReward}
        ListHeaderComponent={
          <>
            {/* Balance */}
            <View
              style={shadows.card}
              className="mb-1 rounded-2xl border border-border bg-card p-4"
            >
              <Text className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                Puntos disponibles
              </Text>
              <Text
                className="mt-1 font-mono-bold text-5xl text-points"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {myPoints}
              </Text>
              <View className="mt-2 flex-row items-center gap-1.5">
                <View className="h-1.5 w-1.5 rounded-full bg-success" />
                <Text className="font-sans text-xs text-muted-foreground">
                  {availableCount}{" "}
                  {availableCount === 1 ? "premio" : "premios"} al alcance
                </Text>
              </View>
            </View>

            {/* Acciones */}
            <View className="mb-3 mt-3 flex-row flex-wrap gap-2">
              <Button
                label="Mis canjes"
                variant="outline"
                size="sm"
                onPress={() => navigation.navigate("MyRedemptions")}
                iconLeft={
                  <Ionicons
                    name="receipt-outline"
                    size={14}
                    color={colors.text}
                  />
                }
              />
              {isManager && (
                <>
                  <Button
                    label="Gestionar"
                    variant="outline"
                    size="sm"
                    onPress={() => navigation.navigate("ManageRewards")}
                    iconLeft={
                      <Ionicons
                        name="settings-outline"
                        size={14}
                        color={colors.primary}
                      />
                    }
                  />
                  <Button
                    label="Aprobar canjes"
                    variant="outline"
                    size="sm"
                    onPress={() => navigation.navigate("RewardApprovals")}
                    iconLeft={
                      <Ionicons
                        name="checkmark-done-outline"
                        size={14}
                        color={colors.primary}
                      />
                    }
                  />
                </>
              )}
            </View>

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

            {isLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : null}

            {!isLoading && rewards.length === 0 ? (
              <View className="items-center px-6 py-16">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Ionicons name="gift-outline" size={32} color={colors.muted} />
                </View>
                <Text className="text-center font-sans-semibold text-base text-foreground">
                  Sin premios aún
                </Text>
                <Text className="mt-1 text-center font-sans text-sm text-muted-foreground">
                  Aún no hay premios disponibles en este grupo.
                </Text>
              </View>
            ) : null}

            {!isLoading && rewards.length > 0 ? (
              <Text className="mb-1 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Premios disponibles
              </Text>
            ) : null}
          </>
        }
      />
    </SafeAreaView>
  );
}
