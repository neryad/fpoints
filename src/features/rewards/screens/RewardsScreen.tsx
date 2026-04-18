import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
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
  const { colors, spacing, fontSize, fontWeight, radius } = useTheme();
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
          } finally {
            // redemption complete
          }
        },
      });
    },
    [activeGroupId, loadData]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing[4] }} edges={["top"]}>
      <ConfirmDialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmText={dialog?.confirmText ?? ""}
        destructive={dialog?.destructive}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />

      {/* Balance card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing[4], marginBottom: spacing[3] }]}>
        <Text style={{ fontSize: fontSize.xxs, fontWeight: fontWeight.medium, color: colors.muted, letterSpacing: 0.8, textTransform: "uppercase" }}>
          Puntos disponibles
        </Text>
        <Text style={{ fontSize: 40, fontWeight: fontWeight.bold, color: colors.textPrimary, lineHeight: 46, marginTop: spacing[1] }}>
          {myPoints}
        </Text>
        <Text style={{ fontSize: fontSize.xxs, color: colors.muted, marginTop: 2 }}>
          {rewards.filter((r) => r.active && myPoints >= r.costPoints).length} premios al alcance
        </Text>
      </View>

      {/* Acciones */}
      <View style={[styles.actionsRow, { gap: spacing[2], marginBottom: spacing[3] }]}>
        <Pressable
          onPress={() => navigation.navigate("MyRedemptions")}
          style={({ pressed }) => [styles.chip, { borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[2], opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text }}>Mis canjes</Text>
        </Pressable>

        {isManager && (
          <>
            <Pressable
              onPress={() => navigation.navigate("ManageRewards")}
              style={({ pressed }) => [styles.chip, { borderColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[2], backgroundColor: colors.primarySoft, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.primary }}>Gestionar</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("RewardApprovals")}
              style={({ pressed }) => [styles.chip, { borderColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[2], backgroundColor: colors.primarySoft, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.primary }}>Aprobar canjes</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Feedback */}
      {error ? (
        <Text style={{ color: colors.error, fontSize: fontSize.xs, textAlign: "center", marginBottom: spacing[2] }}>
          {error}
        </Text>
      ) : null}
      {successMessage ? (
        <Text style={{ color: colors.success, fontSize: fontSize.xs, textAlign: "center", marginBottom: spacing[2] }}>
          {successMessage}
        </Text>
      ) : null}

      {/* Loading */}
      {isLoading ? <SkeletonLoader variant="list" count={3} /> : null}

      {/* Empty */}
      {!isLoading && !error && rewards.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title="Sin premios aún"
          message="Aún no hay premios disponibles. ¡Crea uno para motivar al equipo!"
        />
      ) : null}

      {/* Lista */}
      {!isLoading && rewards.length > 0 ? (
        <FlatList
          data={rewards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing[7], gap: spacing[3] }}
          renderItem={({ item }) => (
            <RewardCard
              reward={item}
              userPoints={myPoints}
              onRedeem={() => handleRedeem(item)}
            />
          )}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    borderWidth: 0.5,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 0.5,
  },
});
