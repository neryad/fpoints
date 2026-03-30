import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
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
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myPoints, setMyPoints] = useState(0);
  const [isManager, setIsManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los premios.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  function handleRedeem(reward: Reward) {
    if (!activeGroupId) return;

    Alert.alert(
      "Confirmar canje",
      `Solicitar canje de ${reward.title} por ${reward.costPoints} puntos?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Solicitar",
          onPress: async () => {
            try {
              setError("");
              setSuccessMessage("");
              setRedeemingRewardId(reward.id);
              await requestRewardRedemption(activeGroupId, reward);
              setSuccessMessage(
                "Solicitud enviada. Owner/sub_owner debe aprobarla.",
              );
              await loadData();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "No se pudo solicitar el canje.",
              );
            } finally {
              setRedeemingRewardId(null);
            }
          },
        },
      ],
    );
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Tus puntos disponibles</Text>
        <Text style={styles.balanceValue}>{myPoints}</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("MyRedemptions")}
        >
          <Text style={styles.secondaryButtonText}>Mis canjes</Text>
        </Pressable>

        {isManager ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("ManageRewards")}
          >
            <Text style={styles.secondaryButtonText}>Gestionar premios</Text>
          </Pressable>
        ) : null}

        {isManager ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("RewardApprovals")}
          >
            <Text style={styles.secondaryButtonText}>Aprobar canjes</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      {rewards.length === 0 ? (
        <Text style={styles.infoText}>Aun no hay premios disponibles.</Text>
      ) : null}

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const insufficientPoints = myPoints < item.costPoints;

          return (
            <View style={[styles.card, !item.active && styles.cardInactive]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardPoints}>{item.costPoints} pts</Text>
              </View>
              {!item.active ? (
                <Text style={styles.metaText}>Inactivo</Text>
              ) : insufficientPoints ? (
                <Text style={styles.metaText}>No te alcanzan los puntos.</Text>
              ) : (
                <Text style={styles.metaText}>Disponible para solicitar.</Text>
              )}

              <Pressable
                style={[
                  styles.primaryButton,
                  (!item.active || insufficientPoints) &&
                    styles.primaryDisabled,
                ]}
                onPress={() => handleRedeem(item)}
                disabled={
                  !item.active ||
                  insufficientPoints ||
                  redeemingRewardId === item.id
                }
              >
                <Text style={styles.primaryButtonText}>
                  {redeemingRewardId === item.id
                    ? "Enviando..."
                    : "Solicitar canje"}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  balanceLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  balanceValue: {
    marginTop: 6,
    color: colors.primary,
    fontSize: 30,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 12,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardInactive: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  cardPoints: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  metaText: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontWeight: "700",
  },
  infoText: {
    marginTop: 16,
    textAlign: "center",
    color: colors.muted,
  },
  errorText: {
    marginTop: 8,
    color: "#B42318",
    textAlign: "center",
  },
  successText: {
    marginTop: 8,
    color: "#0B6E4F",
    textAlign: "center",
  },
});
