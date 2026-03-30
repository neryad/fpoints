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
  listMyPointHistory,
  type PointHistoryEntry,
} from "../services/points.service";

type Props = NativeStackScreenProps<HomeStackParamList, "PointHistory">;

function formatReason(reason: string, taskTitle: string | null) {
  if (reason.startsWith("task_approved:")) {
    return taskTitle ? `Tarea aprobada: ${taskTitle}` : "Tarea aprobada";
  }
  return reason;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function PointHistoryScreen({ navigation }: Props) {
  const { activeGroupId } = useAppSession();
  const [history, setHistory] = useState<PointHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    if (!activeGroupId) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      setError("");
      setIsLoading(true);
      const data = await listMyPointHistory(activeGroupId);
      setHistory(data);
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
      ) : null}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.reason}>
                {formatReason(item.reason, item.taskTitle)}
              </Text>
              <Text style={styles.amount}>+{item.amount}</Text>
            </View>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
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
    color: colors.primary,
    fontSize: 18,
    fontWeight: "700",
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
  errorText: {
    textAlign: "center",
    color: "#B42318",
    marginBottom: 12,
  },
});
