import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { theme } from "../../../core/theme";
import {
  getMyStreakSummary,
  type StreakSummary,
} from "../../gamification/services/streak.service";
import {
  getMyXpSummary,
  type XpSummary,
} from "../../gamification/services/xp.service";
import {
  getCurrentUserIdForPoints,
  getGroupPointsLeaderboard,
  getMyPointsBalance,
  getMyWeeklyPointsBalance,
  getMyWeeklyPointsEarned,
  getWeeklyGroupPointsLeaderboard,
  type GroupPointsEntry,
} from "../services/points.service";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeDashboard">;

const WEEKLY_XP_GOAL = 200;
const DEFAULT_STREAK_SUMMARY: StreakSummary = {
  currentStreak: 0,
  lastActiveDate: null,
  isActiveToday: false,
  isAtRisk: false,
  daysSinceLastActivity: null,
  recent7Days: [],
};

// --- Reusable UI Components ---
function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

function PrimaryButton({
  children,
  onPress,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.buttonPrimary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonPrimaryText}>{children}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  children,
  onPress,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonSecondaryText}>{children}</Text>
    </Pressable>
  );
}

function ProgressBar({
  progress,
  color,
  trackColor,
  style,
}: {
  progress: number;
  color?: string;
  trackColor?: string;
  style?: any;
}) {
  return (
    <View
      style={[
        styles.progressTrack,
        { backgroundColor: trackColor || theme.colors.border },
        style,
      ]}
    >
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.max(0, Math.min(progress, 100))}%`,
            backgroundColor: color || theme.colors.primary,
          },
        ]}
      />
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const { activeGroupId, activeGroupName } = useAppSession();
  const [myPoints, setMyPoints] = useState(0);
  const [myWeeklyPoints, setMyWeeklyPoints] = useState(0);
  const [myWeeklyPointsEarned, setMyWeeklyPointsEarned] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<GroupPointsEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<GroupPointsEntry[]>([]);
  const [streak, setStreak] = useState<StreakSummary>(DEFAULT_STREAK_SUMMARY);
  const [xp, setXp] = useState<XpSummary>({
    totalXp: 0,
    currentLevel: 1,
    levelName: "F",
    xpInCurrentLevel: 0,
    xpNeededForNextLevel: 100,
    progressPercent: 0,
    isMaxLevel: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const prevRankRef = useRef<{ groupId: string; levelNumber: number } | null>(null);

  function formatLocalDate(value: string) {
    const [year, month, day] = value.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString();
  }
  function formatWeekday(dateKey: string) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dayLabel = date.toLocaleDateString(undefined, { weekday: "short" });
    return dayLabel.slice(0, 2).toUpperCase();
  }
  const weeklyGoalProgressPercent = useMemo(
    () =>
      Math.min(
        100,
        Math.max(0, Math.round((myWeeklyPointsEarned / WEEKLY_XP_GOAL) * 100)),
      ),
    [myWeeklyPointsEarned],
  );
  const topWeeklyEntries = useMemo(
    () => weeklyLeaderboard.slice(0, 3),
    [weeklyLeaderboard],
  );
  const handleGoToTasks = useCallback(() => {
    navigation.getParent()?.navigate("Tasks");
  }, [navigation]);
  const handleGoToHistory = useCallback(() => {
    navigation.navigate("PointHistory");
  }, [navigation]);
  const loadPoints = useCallback(async () => {
    if (!activeGroupId) {
      prevRankRef.current = null;
      setMyPoints(0);
      setMyWeeklyPoints(0);
      setMyWeeklyPointsEarned(0);
      setMyUserId(null);
      setLeaderboard([]);
      setWeeklyLeaderboard([]);
      setStreak(DEFAULT_STREAK_SUMMARY);
      setXp({
        totalXp: 0,
        currentLevel: 1,
        levelName: "F",
        xpInCurrentLevel: 0,
        xpNeededForNextLevel: 100,
        progressPercent: 0,
        isMaxLevel: false,
      });
      setIsLoading(false);
      return;
    }
    try {
      setError("");
      setIsLoading(true);
      const [
        myBalance,
        myWeekBalance,
        myWeekEarned,
        ranking,
        weekRanking,
        userId,
        myXp,
      ] = await Promise.all([
        getMyPointsBalance(activeGroupId),
        getMyWeeklyPointsBalance(activeGroupId),
        getMyWeeklyPointsEarned(activeGroupId),
        getGroupPointsLeaderboard(activeGroupId),
        getWeeklyGroupPointsLeaderboard(activeGroupId),
        getCurrentUserIdForPoints(),
        getMyXpSummary(activeGroupId),
      ]);
      let myStreak: StreakSummary | null = null;
      try {
        myStreak = await getMyStreakSummary(activeGroupId);
      } catch (streakError) {
        // ignore
      }
      setMyPoints(myBalance);
      setMyWeeklyPoints(myWeekBalance);
      setMyWeeklyPointsEarned(myWeekEarned);
      setLeaderboard(ranking);
      setWeeklyLeaderboard(weekRanking);
      setMyUserId(userId);
      setStreak(myStreak ?? DEFAULT_STREAK_SUMMARY);
      setXp(myXp);
      // Rank-up detection
      const prev = prevRankRef.current;
      const isSameGroup = prev !== null && prev.groupId === activeGroupId;
      const hasLeveledUp = isSameGroup && myXp.currentLevel > prev.levelNumber;
      if (hasLeveledUp) {
        // Optionally show a toast or modal
      }
      prevRankRef.current = {
        groupId: activeGroupId,
        levelNumber: myXp.currentLevel,
      };
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los puntos del grupo.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);
  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        {activeGroupName ? (
          <Text style={styles.groupName}>{activeGroupName}</Text>
        ) : null}
        <Text style={styles.heroTitle}>Tus puntos</Text>
        <Text style={styles.heroPoints}>{isLoading ? "--" : myPoints}</Text>
      </View>

      {/* CARD: Weekly Progress */}
      <Card>
        <Text style={styles.cardLabel}>Progreso semanal</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <ProgressBar
              progress={weeklyGoalProgressPercent}
              color={theme.colors.primary}
              trackColor={theme.colors.border}
              style={{ marginTop: theme.spacing[3], marginBottom: theme.spacing[2] }}
            />
            <Text style={styles.xpMeta}>
              {myWeeklyPointsEarned >= WEEKLY_XP_GOAL
                ? `Meta semanal alcanzada (${WEEKLY_XP_GOAL} XP). ¡Excelente!`
                : `${myWeeklyPointsEarned} / ${WEEKLY_XP_GOAL} XP meta semanal`}
            </Text>
          </>
        )}
      </Card>

      {/* CARD: Streak */}
      <Card>
        <Text style={styles.cardLabel}>Racha diaria</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <View style={styles.streakRow}>
              <Text style={styles.streakNumber}>
                {streak.currentStreak}
                <Text style={styles.streakFire}> 🔥</Text>
              </Text>
            </View>
            {streak.isActiveToday ? (
              <Text style={styles.streakOkText}>¡Hoy ya sumaste actividad!</Text>
            ) : streak.isAtRisk ? (
              <Text style={styles.streakRiskText}>
                ¡Completa una actividad hoy para mantener la racha!
              </Text>
            ) : (
              <Text style={styles.rowMeta}>
                Tu racha se reinició. ¡Vamos por una nueva!
              </Text>
            )}
            {streak.lastActiveDate ? (
              <Text style={styles.rowMeta}>
                Última actividad: {formatLocalDate(streak.lastActiveDate)}
              </Text>
            ) : (
              <Text style={styles.rowMeta}>
                Aún no tienes actividad contabilizada.
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
              <PrimaryButton onPress={handleGoToTasks} style={{ marginTop: theme.spacing[3] }}>
                Completar tarea hoy
              </PrimaryButton>
            ) : null}
          </>
        )}
      </Card>

      {/* CARD: Level */}
      <Card>
        <Text style={styles.cardLabel}>Nivel</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <View style={styles.levelRow}>
              <Text style={styles.levelBadge}>{xp.levelName}</Text>
              <Text style={styles.levelName}>Rango {xp.levelName}</Text>
              <Text style={styles.xpTotal}>{xp.totalXp} XP</Text>
            </View>
            <ProgressBar
              progress={xp.progressPercent}
              color={theme.colors.success}
              trackColor={theme.colors.border}
              style={{ marginTop: theme.spacing[2], marginBottom: theme.spacing[1] }}
            />
            {xp.isMaxLevel ? (
              <Text style={styles.xpMeta}>Nivel máximo alcanzado.</Text>
            ) : (
              <Text style={styles.xpMeta}>
                {xp.xpInCurrentLevel} / {xp.xpNeededForNextLevel} XP para el siguiente nivel
              </Text>
            )}
          </>
        )}
      </Card>

      {/* CARD: Weekly Top Ranking */}
      <Card>
        <Text style={styles.cardLabel}>Top semanal</Text>
        {isLoading ? (
          <Text style={styles.rowMeta}>Cargando...</Text>
        ) : topWeeklyEntries.length === 0 ? (
          <Text style={styles.rowMeta}>Sin puntos esta semana.</Text>
        ) : (
          topWeeklyEntries.map((entry, idx) => (
            <View key={entry.userId} style={styles.rankingRow}>
              <Text style={styles.rankingName}>
                #{idx + 1} {entry.displayName}
              </Text>
              <Text style={styles.rankingPoints}>{entry.points} pts</Text>
              {idx < topWeeklyEntries.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))
        )}
      </Card>

      {/* ACTIONS */}
      <View style={styles.actionsRow}>
        <PrimaryButton onPress={handleGoToHistory} style={{ flex: 1 }}>
          Ver historial
        </PrimaryButton>
        <SecondaryButton onPress={loadPoints} disabled={isLoading} style={{ flex: 1 }}>
          Recargar
        </SecondaryButton>
      </View>

      {/* ERROR */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </ScrollView>
  );
}

type RankingSectionProps = {
  title: string;
  isLoading: boolean;
  emptyMessage: string;
  entries: GroupPointsEntry[];
  myUserId: string | null;
};

const RankingSection = React.memo(function RankingSection({
  title,
  isLoading,
  emptyMessage,
  entries,
  myUserId,
}: RankingSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{title}</Text>
      {isLoading ? (
        <Text style={styles.rowMeta}>Cargando...</Text>
      ) : entries.length === 0 ? (
        <Text style={styles.rowMeta}>{emptyMessage}</Text>
      ) : (
        entries.map((entry, index) => (
          <RankingRow
            key={entry.userId}
            index={index}
            userId={entry.userId}
            displayName={entry.displayName}
            points={entry.points}
            myUserId={myUserId}
          />
        ))
      )}
    </View>
  );
});

type RankingRowProps = {
  index: number;
  userId: string;
  displayName: string;
  points: number;
  myUserId: string | null;
};


const RankingRow = React.memo(function RankingRow({
  index,
  userId,
  displayName,
  points,
  myUserId,
}: RankingRowProps) {
  return (
    <View style={styles.rankingRow}>
      <Text style={styles.rankingName}>
        #{index + 1} {userId === myUserId ? "Tu" : displayName}
      </Text>
      <Text style={styles.rankingPoints}>{points} pts</Text>
    </View>
  );
});

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    padding: theme.spacing[6],
    backgroundColor: theme.colors.background,
    minHeight: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing[6],
    marginTop: theme.spacing[2],
  },
  groupName: {
    color: theme.colors.muted,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing[1],
  },
  heroTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing[1],
  },
  heroPoints: {
    fontSize: 48,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing[1],
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[5],
    marginBottom: theme.spacing[4],
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing[2],
  },
  xpMeta: {
    marginTop: theme.spacing[2],
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    textAlign: "center",
  },
  streakRow: {
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  streakFire: {
    fontSize: 28,
  },
  streakOkText: {
    color: theme.colors.success,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing[1],
    textAlign: "center",
  },
  streakRiskText: {
    color: theme.colors.warning,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing[1],
    textAlign: "center",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[1],
    gap: theme.spacing[1],
  },
  dayDot: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingVertical: theme.spacing[1],
    alignItems: "center",
    marginHorizontal: 1,
  },
  dayDotActive: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.success,
  },
  dayDotInactive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  dayDotText: {
    fontSize: theme.fontSize.xxs,
    fontWeight: theme.fontWeight.bold,
  },
  dayDotTextActive: {
    color: theme.colors.success,
  },
  dayDotTextInactive: {
    color: theme.colors.muted,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  levelBadge: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryText,
    backgroundColor: theme.colors.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    textAlign: "center",
    lineHeight: 38,
    overflow: "hidden",
    marginRight: theme.spacing[2],
  },
  levelName: {
    flex: 1,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  xpTotal: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    fontWeight: theme.fontWeight.medium,
  },
  progressTrack: {
    height: 12,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.full,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: 12,
    borderRadius: theme.radius.full,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing[2],
    position: "relative",
  },
  rankingName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  rankingPoints: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: theme.colors.divider,
    opacity: 0.5,
  },
  actionsRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
    marginTop: theme.spacing[5],
    marginBottom: theme.spacing[2],
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing[3],
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: theme.spacing[1],
  },
  buttonPrimaryText: {
    color: theme.colors.textInverse,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.base,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing[3],
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: theme.spacing[1],
  },
  buttonSecondaryText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.base,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  rowMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    textAlign: "center",
  },
  errorText: {
    marginTop: theme.spacing[4],
    color: theme.colors.error,
    textAlign: "center",
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
});
