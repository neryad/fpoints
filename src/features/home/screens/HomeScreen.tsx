import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
import {
  getCurrentUserIdForPoints,
  getGroupPointsLeaderboard,
  getMyPointsBalance,
  getMyWeeklyPointsBalance,
  getWeeklyGroupPointsLeaderboard,
  type GroupPointsEntry,
} from "../services/points.service";

export function HomeScreen() {
  const { activeGroupId, activeGroupName } = useAppSession();
  const [myPoints, setMyPoints] = useState(0);
  const [myWeeklyPoints, setMyWeeklyPoints] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<GroupPointsEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<
    GroupPointsEntry[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPoints() {
    if (!activeGroupId) {
      setMyPoints(0);
      setMyUserId(null);
      setLeaderboard([]);
      setIsLoading(false);
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const [myBalance, myWeekBalance, ranking, weekRanking, userId] =
        await Promise.all([
          getMyPointsBalance(activeGroupId),
          getMyWeeklyPointsBalance(activeGroupId),
          getGroupPointsLeaderboard(activeGroupId),
          getWeeklyGroupPointsLeaderboard(activeGroupId),
          getCurrentUserIdForPoints(),
        ]);

      setMyPoints(myBalance);
      setMyWeeklyPoints(myWeekBalance);
      setLeaderboard(ranking);
      setWeeklyLeaderboard(weekRanking);
      setMyUserId(userId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los puntos del grupo.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPoints();
  }, [activeGroupId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Resumen del grupo</Text>
      {activeGroupName ? (
        <Text style={styles.subtitle}>Grupo: {activeGroupName}</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Tus puntos</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.pointsValue}>{myPoints}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Tus puntos esta semana</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.pointsValue}>{myWeeklyPoints}</Text>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Ranking del grupo</Text>
        {isLoading ? (
          <Text style={styles.rowMeta}>Cargando...</Text>
        ) : leaderboard.length === 0 ? (
          <Text style={styles.rowMeta}>Aun no hay puntos registrados.</Text>
        ) : (
          leaderboard.map((entry, index) => (
            <View key={entry.userId} style={styles.row}>
              <Text style={styles.rowTitle}>
                #{index + 1}{" "}
                {entry.userId === myUserId ? "Tu" : entry.displayName}
              </Text>
              <Text style={styles.rowPoints}>{entry.points} pts</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Top semanal</Text>
        {isLoading ? (
          <Text style={styles.rowMeta}>Cargando...</Text>
        ) : weeklyLeaderboard.length === 0 ? (
          <Text style={styles.rowMeta}>Sin puntos esta semana.</Text>
        ) : (
          weeklyLeaderboard.slice(0, 3).map((entry, index) => (
            <View key={entry.userId} style={styles.row}>
              <Text style={styles.rowTitle}>
                #{index + 1}{" "}
                {entry.userId === myUserId ? "Tu" : entry.displayName}
              </Text>
              <Text style={styles.rowPoints}>{entry.points} pts</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.refreshWrap}>
        <Button title="Recargar" onPress={loadPoints} disabled={isLoading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: "100%",
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 14,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 10,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.primary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
  },
  rowTitle: {
    fontSize: 14,
    color: colors.text,
  },
  rowMeta: {
    fontSize: 14,
    color: colors.muted,
  },
  rowPoints: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  refreshWrap: {
    marginTop: 16,
  },
  errorText: {
    marginTop: 12,
    color: "#B42318",
    textAlign: "center",
  },
});
