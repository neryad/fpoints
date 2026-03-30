import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
import { listMyRewardRedemptions } from "../services/rewards.service";
import type { RewardRedemption } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "MyRedemptions">;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export function MyRedemptionsScreen({ navigation }: Props) {
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {items.length === 0 ? (
        <Text style={styles.infoText}>Aun no tienes solicitudes de canje.</Text>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rewardTitle}>{item.rewardTitle}</Text>
              <Text style={styles.rewardPoints}>
                {item.rewardCostPoints} pts
              </Text>
            </View>
            <Text style={styles.metaText}>
              Estado: {STATUS_LABELS[item.status] ?? item.status}
            </Text>
            <Text style={styles.metaText}>
              Fecha: {new Date(item.createdAt).toLocaleString()}
            </Text>
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  rewardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  rewardPoints: {
    color: colors.primary,
    fontWeight: "700",
  },
  metaText: {
    marginTop: 6,
    color: colors.muted,
  },
  infoText: {
    marginTop: 16,
    textAlign: "center",
    color: colors.muted,
  },
  errorText: {
    marginBottom: 10,
    textAlign: "center",
    color: "#B42318",
  },
});
