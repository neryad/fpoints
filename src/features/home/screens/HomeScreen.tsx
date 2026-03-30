import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
import {
  getMyStreakSummary,
  type StreakSummary,
} from "../../gamification/services/streak.service";
import {
  getCurrentUserIdForPoints,
  getGroupPointsLeaderboard,
  getMyPointsBalance,
  getMyWeeklyPointsBalance,
  getWeeklyGroupPointsLeaderboard,
  type GroupPointsEntry,
} from "../services/points.service";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeDashboard">;

export function HomeScreen({ navigation }: Props) {
  const { activeGroupId, activeGroupName } = useAppSession();
  const [myPoints, setMyPoints] = useState(0);
  const [myWeeklyPoints, setMyWeeklyPoints] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<GroupPointsEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<
    GroupPointsEntry[]
  >([]);
  const [streak, setStreak] = useState<StreakSummary>({
    currentStreak: 0,
    lastActiveDate: null,
    isActiveToday: false,
    isAtRisk: false,
    daysSinceLastActivity: null,
    recent7Days: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  function formatLocalDate(value: string) {
    return new Date(value).toLocaleDateString();
  }

  function formatWeekday(dateKey: string) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dayLabel = date.toLocaleDateString(undefined, { weekday: "short" });
    return dayLabel.slice(0, 2).toUpperCase();
  }

  async function loadPoints() {
    if (!activeGroupId) {
      setMyPoints(0);
      setMyWeeklyPoints(0);
      setMyUserId(null);
      setLeaderboard([]);
      setWeeklyLeaderboard([]);
      setStreak({
        currentStreak: 0,
        lastActiveDate: null,
        isActiveToday: false,
        isAtRisk: false,
        daysSinceLastActivity: null,
        recent7Days: [],
      });
      setIsLoading(false);
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const [myBalance, myWeekBalance, ranking, weekRanking, userId, myStreak] =
        await Promise.all([
          getMyPointsBalance(activeGroupId),
          getMyWeeklyPointsBalance(activeGroupId),
          getGroupPointsLeaderboard(activeGroupId),
          getWeeklyGroupPointsLeaderboard(activeGroupId),
          getCurrentUserIdForPoints(),
          getMyStreakSummary(activeGroupId),
        ]);

      setMyPoints(myBalance);
      setMyWeeklyPoints(myWeekBalance);
      setLeaderboard(ranking);
      setWeeklyLeaderboard(weekRanking);
      setMyUserId(userId);
      setStreak(myStreak);
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

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Racha diaria</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Text style={styles.pointsValue}>{streak.currentStreak} dias</Text>
            {streak.isActiveToday ? (
              <Text style={styles.streakOkText}>Hoy ya sumaste actividad.</Text>
            ) : streak.isAtRisk ? (
              <Text style={styles.streakRiskText}>
                Completa una actividad hoy para mantener la racha.
              </Text>
            ) : (
              <Text style={styles.rowMeta}>
                Tu racha se reinicio. Vamos por una nueva.
              </Text>
            )}
            {streak.lastActiveDate ? (
              <Text style={styles.rowMeta}>
                Ultima actividad: {formatLocalDate(streak.lastActiveDate)}
              </Text>
            ) : (
              <Text style={styles.rowMeta}>
                Aun no tienes actividad contabilizada.
              </Text>
            )}

            {streak.recent7Days.length > 0 ? (
              <View style={styles.weekRow}>
                {streak.recent7Days.map((day) => (
                  <View
                    key={day.dateKey}
                    style={[
                      styles.dayDot,
                      day.isActive
                        ? styles.dayDotActive
                        : styles.dayDotInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayDotText,
                        day.isActive
                          ? styles.dayDotTextActive
                          : styles.dayDotTextInactive,
                      ]}
                    >
                      {formatWeekday(day.dateKey)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {streak.isAtRisk ? (
              <View style={styles.streakCtaWrap}>
                <Button
                  title="Completar tarea hoy"
                  onPress={() => navigation.getParent()?.navigate("Tasks")}
                />
              </View>
            ) : null}
          </>
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
        <Button
          title="Ver historial de puntos"
          onPress={() => navigation.navigate("PointHistory")}
        />
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
  streakOkText: {
    color: "#0B6E4F",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  streakRiskText: {
    color: "#B54708",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 12,
  },
  dayDot: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 7,
    alignItems: "center",
  },
  dayDotActive: {
    backgroundColor: "#E8F7F1",
    borderColor: "#0B6E4F",
  },
  dayDotInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  dayDotText: {
    fontSize: 10,
    fontWeight: "700",
  },
  dayDotTextActive: {
    color: "#0B6E4F",
  },
  dayDotTextInactive: {
    color: colors.muted,
  },
  streakCtaWrap: {
    marginTop: 12,
  },
});
