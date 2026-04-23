import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import {
  listMyPointHistoryPage,
  type PointHistoryEntry,
} from "../services/points.service";

type Props = NativeStackScreenProps<HomeStackParamList, "PointHistory">;

const POINT_HISTORY_PAGE_SIZE = 80;

function formatReason(reason: string, taskTitle: string | null, rewardTitle: string | null) {
  if (reason.startsWith("task_approved:"))
    return taskTitle ? `Tarea aprobada: ${taskTitle}` : "Tarea aprobada";
  if (reason.startsWith("reward_redeemed:"))
    return rewardTitle ? `Canje aprobado: ${rewardTitle}` : "Canje aprobado";
  return reason;
}

function formatAmount(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function PointHistoryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { activeGroupId } = useAppSession();
  const [history, setHistory] = useState<PointHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [error, setError] = useState("");
  const isLoadingMoreRef = useRef(false);

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
      setError(err instanceof Error ? err.message : "No se pudo cargar el historial de puntos.");
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  const loadMoreHistory = useCallback(async () => {
    if (!activeGroupId || isLoading || isLoadingMoreRef.current || !hasMore) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      setError("");
      const page = await listMyPointHistoryPage(activeGroupId, {
        limit: POINT_HISTORY_PAGE_SIZE,
        offset: nextOffset,
      });
      setHistory((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar mas historial de puntos.");
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [activeGroupId, hasMore, isLoading, nextOffset]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadHistory);
    return unsubscribe;
  }, [navigation, loadHistory]);

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
        <Text className="text-destructive text-center mb-3 font-sans">{error}</Text>
      ) : null}
      {history.length === 0 ? (
        <Text className="text-muted-foreground text-center">
          Todavia no tienes movimientos de puntos.
        </Text>
      ) : (
        <Text className="text-xs text-muted-foreground text-center mb-2">
          Mostrando {history.length} movimientos.
        </Text>
      )}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        onEndReached={loadMoreHistory}
        onEndReachedThreshold={0.35}
        renderItem={({ item }) => (
          <View className="bg-card border border-border rounded-xl p-3 mb-3">
            <View className="flex-row justify-between items-center">
              <Text className="flex-1 text-base font-sans-semibold text-foreground mr-2">
                {formatReason(item.reason, item.taskTitle, item.rewardTitle)}
              </Text>
              <Text className={`text-lg font-sans-bold ${item.amount < 0 ? "text-destructive" : "text-primary"}`}>
                {formatAmount(item.amount)}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground mt-2">
              {formatDate(item.createdAt)}
            </Text>
          </View>
        )}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator className="mt-2 mb-3" size="small" color={colors.primary} />
          ) : hasMore ? (
            <Text className="text-xs text-muted-foreground text-center mb-2">Desliza para cargar mas...</Text>
          ) : history.length > 0 ? (
            <Text className="text-xs text-muted-foreground text-center mb-2">Fin del historial.</Text>
          ) : null
        }
      />
    </View>
  );
}
