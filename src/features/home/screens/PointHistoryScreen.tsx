import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import shadows from "../../../../design-system-rn/tokens/shadows";
import { HomeStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import {
  listMyPointHistoryPage,
  type PointHistoryEntry,
} from "../services/points.service";

type Props = NativeStackScreenProps<HomeStackParamList, "PointHistory">;

const POINT_HISTORY_PAGE_SIZE = 80;

type EntryType = "task" | "reward" | "other";

function getEntryType(reason: string): EntryType {
  if (reason.startsWith("task_approved:")) return "task";
  if (reason.startsWith("reward_redeemed:")) return "reward";
  return "other";
}

function formatTitle(
  reason: string,
  taskTitle: string | null,
  rewardTitle: string | null,
): string {
  if (reason.startsWith("task_approved:")) return taskTitle ?? "Tarea aprobada";
  if (reason.startsWith("reward_redeemed:"))
    return rewardTitle ?? "Canje aprobado";
  return reason;
}

function formatSubtitle(type: EntryType): string {
  if (type === "task") return "Tarea completada";
  if (type === "reward") return "Canje de recompensa";
  return "Ajuste";
}

function formatAmount(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* -------------------------------------------------------------------------- */
/*  ENTRY ICON                                                                 */
/* -------------------------------------------------------------------------- */

function EntryIcon({
  type,
  colors,
}: {
  type: EntryType;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  if (type === "task") {
    return (
      <View className="h-11 w-11 items-center justify-center rounded-full bg-success/15">
        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
      </View>
    );
  }
  if (type === "reward") {
    return (
      <View className="h-11 w-11 items-center justify-center rounded-full bg-points/15">
        <Ionicons name="gift" size={22} color={colors.points} />
      </View>
    );
  }
  return (
    <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
      <Ionicons name="swap-horizontal" size={20} color={colors.muted} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  HISTORY ITEM                                                               */
/* -------------------------------------------------------------------------- */

function HistoryItem({ item }: { item: PointHistoryEntry }) {
  const { colors } = useTheme();
  const type = getEntryType(item.reason);
  const isPositive = item.amount > 0;

  return (
    <View
      style={shadows.card}
      className="mb-3 flex-row items-center gap-3 rounded-xl border border-border bg-card p-3.5"
    >
      <EntryIcon type={type} colors={colors} />

      <View className="flex-1">
        <Text
          className="font-sans-semibold text-sm text-foreground"
          numberOfLines={1}
        >
          {formatTitle(item.reason, item.taskTitle, item.rewardTitle)}
        </Text>
        <Text className="mt-0.5 font-sans text-xs text-muted-foreground">
          {formatSubtitle(type)}
        </Text>
        <Text className="mt-1 font-sans text-[10px] text-muted-foreground/70">
          {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
        </Text>
      </View>

      <View
        className={`rounded-full px-2.5 py-1 ${isPositive ? "bg-success/15" : "bg-destructive/15"}`}
      >
        <Text
          className={`font-mono-bold text-sm ${isPositive ? "text-success" : "text-destructive"}`}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {formatAmount(item.amount)}
        </Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  SUMMARY HEADER                                                             */
/* -------------------------------------------------------------------------- */

function SummaryHeader({ history }: { history: PointHistoryEntry[] }) {
  const net = history.reduce((acc, e) => acc + e.amount, 0);
  const earned = history.filter((e) => e.amount > 0).reduce((acc, e) => acc + e.amount, 0);
  const spent = history.filter((e) => e.amount < 0).reduce((acc, e) => acc + e.amount, 0);

  return (
    <View
      style={shadows.card}
      className="mb-4 rounded-2xl border border-border bg-card p-4"
    >
      <Text className="mb-3 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
        Resumen del historial
      </Text>
      <View className="flex-row gap-3">
        <View className="flex-1 items-center rounded-xl bg-success/10 py-3">
          <Text
            className="font-mono-bold text-xl text-success"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            +{earned}
          </Text>
          <Text className="mt-0.5 font-sans text-[10px] text-muted-foreground">
            Ganados
          </Text>
        </View>
        <View className="flex-1 items-center rounded-xl bg-destructive/10 py-3">
          <Text
            className="font-mono-bold text-xl text-destructive"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {spent}
          </Text>
          <Text className="mt-0.5 font-sans text-[10px] text-muted-foreground">
            Canjeados
          </Text>
        </View>
        <View className="flex-1 items-center rounded-xl bg-points/10 py-3">
          <Text
            className={`font-mono-bold text-xl ${net >= 0 ? "text-points" : "text-destructive"}`}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {net >= 0 ? `+${net}` : net}
          </Text>
          <Text className="mt-0.5 font-sans text-[10px] text-muted-foreground">
            Neto
          </Text>
        </View>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  EMPTY STATE                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  const { colors } = useTheme();
  return (
    <View className="flex-1 items-center justify-center px-6 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Ionicons name="receipt-outline" size={32} color={colors.muted} />
      </View>
      <Text className="text-center font-sans-semibold text-base text-foreground">
        Sin movimientos aún
      </Text>
      <Text className="mt-1 text-center font-sans text-sm text-muted-foreground">
        Completa tareas o canjea recompensas para ver tu historial aquí.
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

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
    if (!activeGroupId || isLoading || isLoadingMoreRef.current || !hasMore)
      return;
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
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar más historial de puntos.",
      );
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
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {error ? (
        <View className="mx-4 mb-2 mt-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <Text className="font-sans-medium text-sm text-destructive">
            {error}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        onEndReached={loadMoreHistory}
        onEndReachedThreshold={0.35}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          history.length > 0 ? (
            <>
              <SummaryHeader history={history} />
              <Text className="mb-3 font-sans text-xs text-muted-foreground">
                {history.length} movimientos
              </Text>
            </>
          ) : null
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => <HistoryItem item={item} />}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              className="mb-3 mt-2"
              size="small"
              color={colors.primary}
            />
          ) : hasMore ? (
            <Text className="mb-2 text-center font-sans text-xs text-muted-foreground">
              Desliza para cargar más...
            </Text>
          ) : history.length > 0 ? (
            <View className="mt-2 items-center">
              <Text className="font-sans text-xs text-muted-foreground">
                · Fin del historial ·
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
