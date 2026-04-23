import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import { RewardCard } from "../../../components/ui/RewardCard";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonLoader } from "../../../components/ui/SkeletonLoader";
import { getMyPointsBalance } from "../../home/services/points.service";
import {
  canManageRewards,
  listGroupRewards,
  requestRewardRedemption,
} from "../services/rewards.service";
import type { Reward } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "RewardsList">;

export function RewardsScreen({ navigation }: Props) {
  const { activeGroupId } = useAppSession();

  const [rewards, setRewards]       = useState<Reward[]>([]);
  const [myPoints, setMyPoints]     = useState(0);
  const [isManager, setIsManager]   = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dialog, setDialog]         = useState<null | {
    title: string; message: string; confirmText: string;
    destructive?: boolean; onConfirm: () => void;
  }>(null);

  const loadData = useCallback(async () => {
    if (!activeGroupId) {
      setRewards([]); setMyPoints(0); setIsManager(false); setIsLoading(false);
      return;
    }
    try {
      setError(""); setSuccessMessage(""); setIsLoading(true);
      const [canManage, balance] = await Promise.all([
        canManageRewards(activeGroupId),
        getMyPointsBalance(activeGroupId),
      ]);
      const rewardsData = await listGroupRewards(activeGroupId, canManage);
      setIsManager(canManage);
      setMyPoints(balance);
      setRewards(rewardsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los premios.");
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
            setError(""); setSuccessMessage("");
            await requestRewardRedemption(activeGroupId, reward);
            setSuccessMessage("Solicitud enviada. Esperando aprobación.");
            await loadData();
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo solicitar el canje.");
          }
        },
      });
    },
    [activeGroupId, loadData]
  );

  const renderReward = useCallback(
    ({ item }: { item: Reward }) => (
      <RewardCard
        reward={item}
        userPoints={myPoints}
        onRedeem={() => handleRedeem(item)}
      />
    ),
    [myPoints, handleRedeem]
  );

  const availableCount = rewards.filter((r) => r.active && myPoints >= r.costPoints).length;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background p-4" edges={["top"]}>
      <ConfirmDialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmText={dialog?.confirmText ?? ""}
        destructive={dialog?.destructive}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />

      {/* Balance */}
      <View className="bg-card border border-border rounded-xl p-4 mb-3">
        <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px]">
          Puntos disponibles
        </Text>
        <Text className="text-[40px] font-sans-bold text-foreground leading-[46px] mt-1">
          {myPoints}
        </Text>
        <Text className="text-[11px] text-muted-foreground mt-[2px]">
          {availableCount} premios al alcance
        </Text>
      </View>

      {/* Acciones */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        <Pressable
          onPress={() => navigation.navigate("MyRedemptions")}
          className="border border-border rounded-full px-3 py-2 bg-card active:opacity-70"
        >
          <Text className="text-xs font-sans-semibold text-foreground">Mis canjes</Text>
        </Pressable>

        {isManager && (
          <>
            <Pressable
              onPress={() => navigation.navigate("ManageRewards")}
              className="border border-primary rounded-full px-3 py-2 bg-primary/10 active:opacity-70"
            >
              <Text className="text-xs font-sans-semibold text-primary">Gestionar</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("RewardApprovals")}
              className="border border-primary rounded-full px-3 py-2 bg-primary/10 active:opacity-70"
            >
              <Text className="text-xs font-sans-semibold text-primary">Aprobar canjes</Text>
            </Pressable>
          </>
        )}
      </View>

      {error ? (
        <Text className="text-destructive text-xs text-center mb-2 font-sans">{error}</Text>
      ) : null}
      {successMessage ? (
        <Text className="text-success text-xs text-center mb-2 font-sans">{successMessage}</Text>
      ) : null}

      {isLoading ? <SkeletonLoader variant="list" count={3} /> : null}

      {!isLoading && !error && rewards.length === 0 ? (
        <EmptyState
          icon="gift-outline"
          title="Sin premios aún"
          message="Aún no hay premios disponibles. ¡Crea uno para motivar al equipo!"
        />
      ) : null}

      {!isLoading && rewards.length > 0 ? (
        <FlatList
          data={rewards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
          renderItem={renderReward}
        />
      ) : null}
    </SafeAreaView>
  );
}
