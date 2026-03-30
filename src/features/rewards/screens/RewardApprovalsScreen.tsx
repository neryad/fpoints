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
import { getUserDisplayNames } from "../../tasks/services/tasks.service";
import {
  canManageRewards,
  listPendingRewardRedemptions,
  reviewRewardRedemption,
} from "../services/rewards.service";
import type { RewardRedemption } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "RewardApprovals">;

export function RewardApprovalsScreen({ navigation }: Props) {
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

  function handleReview(
    item: RewardRedemption,
    status: "approved" | "rejected",
  ) {
    const label = status === "approved" ? "aprobar" : "rechazar";

    Alert.alert("Confirmar", `Seguro que quieres ${label} este canje?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: status === "approved" ? "Aprobar" : "Rechazar",
        style: status === "rejected" ? "destructive" : "default",
        onPress: async () => {
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
              err instanceof Error
                ? err.message
                : "No se pudo revisar el canje.",
            );
          } finally {
            setReviewingId(null);
          }
        },
      },
    ]);
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

  if (!canReview) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>
          Solo owner/sub_owner puede aprobar o rechazar canjes.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}
      {items.length === 0 ? (
        <Text style={styles.infoText}>No hay canjes pendientes.</Text>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.rewardTitle}>{item.rewardTitle}</Text>
            <Text style={styles.metaText}>
              Solicitado por: {userDisplayNames[item.userId] ?? item.userId}
            </Text>
            <Text style={styles.metaText}>
              Costo: {item.rewardCostPoints} pts
            </Text>
            <Text style={styles.metaText}>
              Fecha: {new Date(item.createdAt).toLocaleString()}
            </Text>

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleReview(item, "approved")}
                disabled={reviewingId === item.id}
              >
                <Text style={styles.actionText}>Aprobar</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReview(item, "rejected")}
                disabled={reviewingId === item.id}
              >
                <Text style={styles.actionText}>Rechazar</Text>
              </Pressable>
            </View>
          </View>
        )}
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
    padding: 24,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  rewardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  metaText: {
    marginTop: 6,
    color: colors.muted,
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: colors.primary,
  },
  rejectButton: {
    backgroundColor: "#B42318",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  infoText: {
    marginTop: 8,
    textAlign: "center",
    color: colors.muted,
  },
  errorText: {
    marginBottom: 10,
    color: "#B42318",
    textAlign: "center",
  },
  successText: {
    marginBottom: 10,
    color: "#0B6E4F",
    textAlign: "center",
  },
});
