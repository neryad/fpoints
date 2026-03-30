import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
import {
  listMyPointHistoryPage,
  type PointHistoryEntry,
} from "../services/points.service";

type Props = NativeStackScreenProps<HomeStackParamList, "PointHistory">;

const POINT_HISTORY_PAGE_SIZE = 80;

function formatReason(
  reason: string,
  taskTitle: string | null,
  rewardTitle: string | null,
) {
  if (reason.startsWith("task_approved:")) {
    return taskTitle ? `Tarea aprobada: ${taskTitle}` : "Tarea aprobada";
  }
  if (reason.startsWith("reward_redeemed:")) {
    return rewardTitle ? `Canje aprobado: ${rewardTitle}` : "Canje aprobado";
  }
  return reason;
}

function formatAmount(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function PointHistoryScreen({ navigation }: Props) {
  const { activeGroupId } = useAppSession();
  const [history, setHistory] = useState<PointHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    if (!activeGroupId) {
      setHistory([]);
      setHasMore(false);
      setNextOffset(0);
      setIsLoading(false);
      return;
    }

    try {
      setError("");
      setIsLoading(true);
      const page = await listMyPointHistoryPage(activeGroupId, {
        limit: POINT_HISTORY_PAGE_SIZE,
        offset: 0,
      });
      setHistory(page.items);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial de puntos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  const loadMoreHistory = useCallback(async () => {
    if (!activeGroupId || isLoading || isLoadingMore || !hasMore) {
      return;
    }

    try {
      setError("");
      setIsLoadingMore(true);
      const page = await listMyPointHistoryPage(activeGroupId, {
        limit: POINT_HISTORY_PAGE_SIZE,
        offset: nextOffset,
      });
      setHistory((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar mas historial de puntos.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeGroupId, hasMore, isLoading, isLoadingMore, nextOffset]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadHistory);
    return unsubscribe;
  }, [navigation, loadHistory]);

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
      {history.length === 0 ? (
        <Text style={styles.infoText}>
          Todavia no tienes movimientos de puntos.
        </Text>
      ) : (
        <Text style={styles.captionText}>
          Mostrando {history.length} movimientos.
        </Text>
      )}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMoreHistory}
        onEndReachedThreshold={0.35}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.reason}>
                {formatReason(item.reason, item.taskTitle, item.rewardTitle)}
              </Text>
              <Text
                style={[
                  styles.amount,
                  item.amount < 0
                    ? styles.amountNegative
                    : styles.amountPositive,
                ]}
              >
                {formatAmount(item.amount)}
              </Text>
            </View>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              style={styles.loadingMore}
              size="small"
              color={colors.primary}
            />
          ) : hasMore ? (
            <Text style={styles.captionText}>Desliza para cargar mas...</Text>
          ) : history.length > 0 ? (
            <Text style={styles.captionText}>Fin del historial.</Text>
          ) : null
        }
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
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reason: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
  },
  amountPositive: {
    color: colors.primary,
  },
  amountNegative: {
    color: "#B42318",
  },
  date: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 12,
  },
  infoText: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 24,
  },
  captionText: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    marginBottom: 10,
  },
  loadingMore: {
    marginTop: 8,
    marginBottom: 14,
  },
  errorText: {
    textAlign: "center",
    color: "#B42318",
    marginBottom: 12,
  },
});
