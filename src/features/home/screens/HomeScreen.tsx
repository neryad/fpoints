import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useTheme } from "../../../core/theme/ThemeProvider";
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
import { Theme } from "src/core/theme";

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

// --- Styles ---

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      padding: theme.spacing[4],
      backgroundColor: theme.colors.background,
      minHeight: "100%",
    },

    // Header
    header: {
      alignItems: "center",
      marginBottom: theme.spacing[5],
      marginTop: theme.spacing[2],
      position: "relative",
    },
    groupName: {
      color: theme.colors.muted,
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.medium,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: theme.spacing[1],
    },
    heroPoints: {
      fontSize: 52,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      lineHeight: 56,
      marginBottom: theme.spacing[2],
    },
    deltaPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing[1],
      backgroundColor: theme.colors.successSoft,
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[1],
      borderRadius: theme.radius.full,
    },
    deltaPillText: {
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.success,
    },
    reloadButton: {
      position: "absolute",
      right: 0,
      top: 0,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    reloadButtonText: {
      fontSize: theme.fontSize.base,
      color: theme.colors.muted,
    },

    // Card
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      marginBottom: theme.spacing[3],
    },
    cardLabel: {
      fontSize: 11,
      color: theme.colors.muted,
      fontWeight: theme.fontWeight.medium,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: theme.spacing[3],
    },

    // Progress
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: theme.spacing[2],
    },
    progressNum: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
    },
    progressNumSub: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.muted,
      fontWeight: theme.fontWeight.regular,
    },
    progressGoalLabel: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.muted,
    },
    progressTrack: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: theme.radius.full,
      overflow: "hidden",
      marginBottom: theme.spacing[1],
    },
    progressFill: {
      height: 8,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.success,
    },
    progressSub: {
      fontSize: 11,
      color: theme.colors.muted,
      marginBottom: theme.spacing[4],
    },

    // Mini leaderboard
    lbDivider: {
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing[3],
    },
    lbTitle: {
      fontSize: 11,
      color: theme.colors.muted,
      fontWeight: theme.fontWeight.medium,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: theme.spacing[2],
    },
    lbRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing[2],
      paddingVertical: theme.spacing[1],
    },
    lbRank: {
      fontSize: 11,
      color: theme.colors.muted,
      width: 16,
      textAlign: "center",
    },
    lbAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft ?? theme.colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    lbAvatarMe: {
      backgroundColor: theme.colors.successSoft,
    },
    lbAvatarText: {
      fontSize: 10,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.primary,
    },
    lbAvatarTextMe: {
      color: theme.colors.success,
    },
    lbName: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      color: theme.colors.text,
    },
    lbNameMe: {
      color: theme.colors.success,
      fontWeight: theme.fontWeight.semibold,
    },
    lbPts: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
    },
    lbPtsMe: {
      color: theme.colors.success,
    },

    // Streak
    streakMain: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing[3],
      marginBottom: theme.spacing[3],
    },
    streakNumber: {
      fontSize: 36,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      lineHeight: 40,
    },
    streakFire: {
      fontSize: 28,
    },
    streakInfo: {
      flex: 1,
    },
    streakStatusOk: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.success,
      marginBottom: 2,
    },
    streakStatusRisk: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.warning,
      marginBottom: 2,
    },
    streakStatusNeutral: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.muted,
      marginBottom: 2,
    },
    streakSub: {
      fontSize: 11,
      color: theme.colors.muted,
    },
    weekPills: {
      flexDirection: "row",
      gap: theme.spacing[1],
    },
    dayPill: {
      flex: 1,
      height: 30,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
    },
    dayPillActive: {
      backgroundColor: theme.colors.successSoft,
      borderColor: theme.colors.success,
    },
    dayPillText: {
      fontSize: 10,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.muted,
    },
    dayPillTextActive: {
      color: theme.colors.success,
    },
    streakCta: {
      marginTop: theme.spacing[3],
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing[3],
      alignItems: "center",
    },
    streakCtaText: {
      color: theme.colors.textInverse,
      fontWeight: theme.fontWeight.bold,
      fontSize: theme.fontSize.sm,
    },

    // Level
    levelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing[3],
      marginBottom: theme.spacing[3],
    },
    levelBadge: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    levelBadgeText: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
    },
    levelInfo: {
      flex: 1,
    },
    levelName: {
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    levelXp: {
      fontSize: 11,
      color: theme.colors.muted,
    },
    levelProgressTrack: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: theme.radius.full,
      overflow: "hidden",
      marginBottom: theme.spacing[1],
    },
    levelProgressFill: {
      height: 8,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
    },
    levelNext: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    levelNextText: {
      fontSize: 11,
      color: theme.colors.muted,
    },
    levelNextHighlight: {
      fontSize: 11,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
    },
    levelMax: {
      fontSize: 11,
      color: theme.colors.success,
      textAlign: "center",
      marginTop: theme.spacing[1],
    },

    // CTA primary button
    ctaButton: {
      backgroundColor: theme.colors.text,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing[4],
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing[2],
    },
    ctaButtonText: {
      color: theme.colors.background,
      fontWeight: theme.fontWeight.bold,
      fontSize: theme.fontSize.base,
    },
    ctaButtonPressed: {
      opacity: 0.75,
    },

    // Misc
    loadingRow: {
      paddingVertical: theme.spacing[3],
      alignItems: "center",
    },
    errorText: {
      marginTop: theme.spacing[4],
      color: theme.colors.error,
      textAlign: "center",
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
    },
  });
}

// --- Helper functions ---

function formatLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

function formatWeekday(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString(undefined, { weekday: "short" })
    .slice(0, 2)
    .toUpperCase();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// --- Sub-components ---

function Header({
  groupName,
  points,
  weeklyDelta,
  isLoading,
  onReload,
}: {
  groupName: string | null;
  points: number;
  weeklyDelta: number;
  isLoading: boolean;
  onReload: () => void;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.header}>
      {groupName ? (
        <Text style={styles.groupName}>{groupName}</Text>
      ) : null}
      <Text style={styles.heroPoints}>{isLoading ? "--" : points}</Text>
      {!isLoading && weeklyDelta > 0 && (
        <View style={styles.deltaPill}>
          <Text style={styles.deltaPillText}>↑ +{weeklyDelta} esta semana</Text>
        </View>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.reloadButton,
          pressed && { opacity: 0.6 },
        ]}
        onPress={onReload}
        disabled={isLoading}
      >
        <Text style={styles.reloadButtonText}>↻</Text>
      </Pressable>
    </View>
  );
}

function WeeklyProgressCard({
  isLoading,
  earned,
  goal,
  weeklyLeaderboard,
  myUserId,
}: {
  isLoading: boolean;
  earned: number;
  goal: number;
  weeklyLeaderboard: GroupPointsEntry[];
  myUserId: string | null;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const percent = Math.min(100, Math.round((earned / goal) * 100));
  const remaining = Math.max(0, goal - earned);
  const topEntries = weeklyLeaderboard.slice(0, 3);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Progreso semanal</Text>
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.progressHeader}>
            <Text style={styles.progressNum}>
              {earned}{" "}
              <Text style={styles.progressNumSub}>/ {goal} XP</Text>
            </Text>
            <Text style={styles.progressGoalLabel}>Meta semanal</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` as any }]} />
          </View>
          <Text style={styles.progressSub}>
            {earned >= goal
              ? `¡Meta alcanzada! (${goal} XP)`
              : `${percent}% completado · ${remaining} XP para la meta`}
          </Text>

          {/* Mini leaderboard inline */}
          {topEntries.length > 0 && (
            <View style={styles.lbDivider}>
              <Text style={styles.lbTitle}>Top semanal</Text>
              {topEntries.map((entry, idx) => {
                const isMe = entry.userId === myUserId;
                return (
                  <View key={entry.userId} style={styles.lbRow}>
                    <Text style={styles.lbRank}>{idx + 1}</Text>
                    <View style={[styles.lbAvatar, isMe && styles.lbAvatarMe]}>
                      <Text style={[styles.lbAvatarText, isMe && styles.lbAvatarTextMe]}>
                        {isMe ? "TÚ" : getInitials(entry.displayName)}
                      </Text>
                    </View>
                    <Text style={[styles.lbName, isMe && styles.lbNameMe]}>
                      {isMe ? "Tú" : entry.displayName}
                    </Text>
                    <Text style={[styles.lbPts, isMe && styles.lbPtsMe]}>
                      {entry.points} pts
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function StreakCard({
  isLoading,
  streak,
  onGoToTasks,
}: {
  isLoading: boolean;
  streak: StreakSummary;
  onGoToTasks: () => void;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Racha diaria</Text>
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.streakMain}>
            <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
            <Text style={styles.streakFire}>🔥</Text>
            <View style={styles.streakInfo}>
              {streak.isActiveToday ? (
                <Text style={styles.streakStatusOk}>¡Hoy ya sumaste actividad!</Text>
              ) : streak.isAtRisk ? (
                <Text style={styles.streakStatusRisk}>¡En riesgo! Completa algo hoy</Text>
              ) : (
                <Text style={styles.streakStatusNeutral}>¡Vamos por una nueva racha!</Text>
              )}
              <Text style={styles.streakSub}>
                {streak.lastActiveDate
                  ? `Última actividad: ${formatLocalDate(streak.lastActiveDate)}`
                  : "Sin actividad aún"}
              </Text>
            </View>
          </View>

          {streak.recent7Days.length > 0 && (
            <View style={styles.weekPills}>
              {streak.recent7Days.map((day) => (
                <View
                  key={day.dateKey}
                  style={[styles.dayPill, day.isActive && styles.dayPillActive]}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      day.isActive && styles.dayPillTextActive,
                    ]}
                  >
                    {formatWeekday(day.dateKey)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {streak.isAtRisk && (
            <Pressable
              style={({ pressed }) => [
                styles.streakCta,
                pressed && { opacity: 0.75 },
              ]}
              onPress={onGoToTasks}
            >
              <Text style={styles.streakCtaText}>Completar tarea hoy</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

function LevelCard({ isLoading, xp }: { isLoading: boolean; xp: XpSummary }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const remaining = xp.xpNeededForNextLevel - xp.xpInCurrentLevel;

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Nivel</Text>
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{xp.levelName}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelName}>Rango {xp.levelName}</Text>
              <Text style={styles.levelXp}>{xp.totalXp} XP acumulados</Text>
            </View>
          </View>
          <View style={styles.levelProgressTrack}>
            <View
              style={[
                styles.levelProgressFill,
                { width: `${xp.progressPercent}%` as any },
              ]}
            />
          </View>
          {xp.isMaxLevel ? (
            <Text style={styles.levelMax}>Nivel máximo alcanzado 🎉</Text>
          ) : (
            <View style={styles.levelNext}>
              <Text style={styles.levelNextText}>
                {xp.xpInCurrentLevel} / {xp.xpNeededForNextLevel} XP
              </Text>
              <Text style={styles.levelNextHighlight}>{remaining} XP para subir</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// --- HomeScreen ---

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { activeGroupId, activeGroupName } = useAppSession();

  const [myPoints, setMyPoints] = useState(0);
  const [myWeeklyPointsEarned, setMyWeeklyPointsEarned] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
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
      setMyWeeklyPointsEarned(0);
      setMyUserId(null);
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
        myWeekEarned,
        weekRanking,
        userId,
        myXp,
      ] = await Promise.all([
        getMyPointsBalance(activeGroupId),
        getMyWeeklyPointsEarned(activeGroupId),
        getWeeklyGroupPointsLeaderboard(activeGroupId),
        getCurrentUserIdForPoints(),
        getMyXpSummary(activeGroupId),
      ]);

      let myStreak: StreakSummary | null = null;
      try {
        myStreak = await getMyStreakSummary(activeGroupId);
      } catch {
        // ignore streak errors silently
      }

      setMyPoints(myBalance);
      setMyWeeklyPointsEarned(myWeekEarned);
      setWeeklyLeaderboard(weekRanking);
      setMyUserId(userId);
      setStreak(myStreak ?? DEFAULT_STREAK_SUMMARY);
      setXp(myXp);

      const prev = prevRankRef.current;
      const isSameGroup = prev !== null && prev.groupId === activeGroupId;
      const hasLeveledUp = isSameGroup && myXp.currentLevel > prev.levelNumber;
      if (hasLeveledUp) {
        // TODO: show level-up toast or modal
      }
      prevRankRef.current = { groupId: activeGroupId, levelNumber: myXp.currentLevel };
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los puntos del grupo."
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
      <Header
        groupName={activeGroupName}
        points={myPoints}
        weeklyDelta={myWeeklyPointsEarned}
        isLoading={isLoading}
        onReload={loadPoints}
      />

      <WeeklyProgressCard
        isLoading={isLoading}
        earned={myWeeklyPointsEarned}
        goal={WEEKLY_XP_GOAL}
        weeklyLeaderboard={weeklyLeaderboard}
        myUserId={myUserId}
      />

      <StreakCard
        isLoading={isLoading}
        streak={streak}
        onGoToTasks={handleGoToTasks}
      />

      <LevelCard isLoading={isLoading} xp={xp} />

      <Pressable
        style={({ pressed }) => [
          styles.ctaButton,
          pressed && styles.ctaButtonPressed,
        ]}
        onPress={handleGoToHistory}
      >
        <Text style={styles.ctaButtonText}>Ver historial de puntos</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
}