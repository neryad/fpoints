import React, {
  useCallback,
  useEffect,
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
import { SafeAreaView } from "react-native-safe-area-context";
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
  getMyPointsBalance,
  getMyWeeklyPointsEarned,
  getWeeklyGroupPointsLeaderboard,
  type GroupPointsEntry,
} from "../services/points.service";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeDashboard">;

const WEEKLY_XP_GOAL = 200;

const DEFAULT_STREAK: StreakSummary = {
  currentStreak: 0,
  lastActiveDate: null,
  isActiveToday: false,
  isAtRisk: false,
  daysSinceLastActivity: null,
  recent7Days: [],
};

const DEFAULT_XP: XpSummary = {
  totalXp: 0,
  currentLevel: 1,
  levelName: "F",
  xpInCurrentLevel: 0,
  xpNeededForNextLevel: 100,
  progressPercent: 0,
  isMaxLevel: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Styles — makeStyles consumes the real theme tokens
// ---------------------------------------------------------------------------

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;

  return StyleSheet.create({
    // ── Screen ──────────────────────────────────────────────────────────────
    container: {
      flexGrow: 1,
      paddingHorizontal: spacing[4],   // 16
      paddingBottom: spacing[8],       // 40
      backgroundColor: colors.background,
    },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      alignItems: "center",
      paddingTop: spacing[4],          // 16
      paddingBottom: spacing[5],       // 20
      position: "relative",
    },
    groupLabel: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: spacing[1],        // 4
      paddingHorizontal: 44,
      maxWidth: "100%",
    },
    heroPoints: {
      fontSize: 52,
      fontWeight: fontWeight.bold,     // "700"
      color: colors.textStrong,
      lineHeight: 58,
      marginBottom: spacing[2],        // 8
    },
    deltaPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.successSoft,
      paddingHorizontal: spacing[3],   // 12
      paddingVertical: spacing[1],     // 4
      borderRadius: radius.full,       // 999
    },
    deltaPillText: {
      fontSize: fontSize.xs,           // 12
      fontWeight: fontWeight.semibold, // "600"
      color: colors.success,
    },
    reloadBtn: {
      position: "absolute",
      right: 0,
      top: spacing[4],                 // 16
      width: 36,
      height: 36,
      borderRadius: radius.full,       // 999
      backgroundColor: colors.surfaceMuted,
      borderWidth: 0.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    reloadBtnText: {
      fontSize: fontSize.base,         // 16
      color: colors.muted,
    },

    // ── Card ────────────────────────────────────────────────────────────────
    card: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,         // 16
      padding: spacing[4],             // 16
      marginBottom: spacing[3],        // 12
    },
    cardLabel: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: spacing[3],        // 12
    },
    loadingWrap: {
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },

    // ── Weekly progress ──────────────────────────────────────────────────────
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: spacing[2],        // 8
    },
    progressNum: {
      fontSize: fontSize.xl,           // 22
      fontWeight: fontWeight.semibold, // "600"
      color: colors.textStrong,
    },
    progressNumSub: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.regular,  // "400"
      color: colors.muted,
    },
    progressGoalLabel: {
      fontSize: fontSize.xs,           // 12
      color: colors.muted,
    },
    track: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: radius.full,
      overflow: "hidden",
      marginBottom: spacing[1],        // 4
    },
    trackFillSuccess: {
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.success,
    },
    trackFillPrimary: {
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    progressSub: {
      fontSize: fontSize.xxs,          // 11
      color: colors.muted,
      marginBottom: spacing[4],        // 16
    },

    // ── Mini leaderboard ─────────────────────────────────────────────────────
    lbDivider: {
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      paddingTop: spacing[3],          // 12
    },
    lbSectionLabel: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: spacing[2],        // 8
    },
    lbRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],                 // 8
      paddingVertical: spacing[1],     // 4
    },
    lbRank: {
      fontSize: fontSize.xxs,          // 11
      color: colors.muted,
      width: 14,
      textAlign: "center",
    },
    lbAvatar: {
      width: 28,
      height: 28,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    lbAvatarMe: {
      backgroundColor: colors.successSoft,
    },
    lbAvatarText: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.semibold, // "600"
      color: colors.primary,
    },
    lbAvatarTextMe: {
      color: colors.success,
    },
    lbName: {
      flex: 1,
      fontSize: fontSize.sm,           // 14
      color: colors.text,
    },
    lbNameMe: {
      fontWeight: fontWeight.semibold, // "600"
      color: colors.success,
    },
    lbPts: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.semibold, // "600"
      color: colors.text,
    },
    lbPtsMe: {
      color: colors.success,
    },

    // ── Streak ───────────────────────────────────────────────────────────────
    streakMain: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],                 // 12
      marginBottom: spacing[3],        // 12
    },
    streakNumber: {
      fontSize: 36,
      fontWeight: fontWeight.bold,     // "700"
      color: colors.textStrong,
      lineHeight: 40,
    },
    streakFire: {
      fontSize: 28,
    },
    streakInfo: {
      flex: 1,
    },
    streakStatusOk: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.semibold, // "600"
      color: colors.success,
      marginBottom: 2,
    },
    streakStatusRisk: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.warning,
      marginBottom: 2,
    },
    streakStatusNeutral: {
      fontSize: fontSize.sm,
      color: colors.muted,
      marginBottom: 2,
    },
    streakSub: {
      fontSize: fontSize.xxs,          // 11
      color: colors.muted,
    },
    weekRow: {
      flexDirection: "row",
      gap: spacing[1],                 // 4
    },
    dayPill: {
      flex: 1,
      height: 30,
      borderRadius: radius.xs,         // 4
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 0.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
    },
    dayPillActive: {
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    },
    dayPillText: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.bold,     // "700"
      color: colors.muted,
    },
    dayPillTextActive: {
      color: colors.success,
    },
    streakCta: {
      marginTop: spacing[3],           // 12
      backgroundColor: colors.primary,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },
    streakCtaText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },

    // ── Level ────────────────────────────────────────────────────────────────
    levelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],                 // 12
      marginBottom: spacing[3],        // 12
    },
    levelBadge: {
      width: 46,
      height: 46,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    levelBadgeText: {
      fontSize: fontSize.lg,           // 18
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primary,
    },
    levelInfo: {
      flex: 1,
    },
    levelName: {
      fontSize: fontSize.base,         // 16
      fontWeight: fontWeight.semibold, // "600"
      color: colors.textStrong,
      marginBottom: 2,
    },
    levelXpLabel: {
      fontSize: fontSize.xxs,          // 11
      color: colors.muted,
    },
    levelNextRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing[1],           // 4
    },
    levelNextText: {
      fontSize: fontSize.xxs,          // 11
      color: colors.muted,
    },
    levelNextHighlight: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.semibold, // "600"
      color: colors.textStrong,
    },
    levelMaxText: {
      fontSize: fontSize.xxs,          // 11
      color: colors.success,
      textAlign: "center",
      marginTop: spacing[1],
    },

    // ── CTA ──────────────────────────────────────────────────────────────────
    ctaBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[4],     // 16
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing[2],           // 8
    },
    ctaBtnText: {
      fontSize: fontSize.base,         // 16
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },

    // ── Error ────────────────────────────────────────────────────────────────
    errorText: {
      marginTop: spacing[4],           // 16
      color: colors.error,
      textAlign: "center",
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.medium,   // "500"
    },
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header({
  groupName,
  points,
  weeklyEarned,
  isLoading,
  onReload,
}: {
  groupName: string | null;
  points: number;
  weeklyEarned: number;
  isLoading: boolean;
  onReload: () => void;
}) {
  const theme = useTheme();
  const s = makeStyles(theme);

  return (
    <View style={s.header}>
      {groupName ? <Text style={s.groupLabel} numberOfLines={1}>{groupName}</Text> : null}
      <Text style={s.heroPoints}>{isLoading ? "--" : points}</Text>
      {!isLoading && weeklyEarned > 0 && (
        <View style={s.deltaPill}>
          <Text style={s.deltaPillText}>↑ +{weeklyEarned} esta semana</Text>
        </View>
      )}
      <Pressable
        style={({ pressed }) => [s.reloadBtn, pressed && { opacity: 0.6 }]}
        onPress={onReload}
        disabled={isLoading}
        accessibilityLabel="Recargar datos"
      >
        <Text style={s.reloadBtnText}>↻</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------

function WeeklyProgressCard({
  isLoading,
  earned,
  weeklyLeaderboard,
  myUserId,
}: {
  isLoading: boolean;
  earned: number;
  weeklyLeaderboard: GroupPointsEntry[];
  myUserId: string | null;
}) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const percent = Math.min(100, Math.round((earned / WEEKLY_XP_GOAL) * 100));
  const remaining = Math.max(0, WEEKLY_XP_GOAL - earned);
  const top3 = weeklyLeaderboard.slice(0, 3);

  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>Progreso semanal</Text>
      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={s.progressHeader}>
            <Text style={s.progressNum}>
              {earned}{" "}
              <Text style={s.progressNumSub}>/ {WEEKLY_XP_GOAL} XP</Text>
            </Text>
            <Text style={s.progressGoalLabel}>Meta semanal</Text>
          </View>
          <View style={s.track}>
            <View style={[s.trackFillSuccess, { width: `${percent}%` as any }]} />
          </View>
          <Text style={s.progressSub}>
            {earned >= WEEKLY_XP_GOAL
              ? `¡Meta alcanzada! (${WEEKLY_XP_GOAL} XP)`
              : `${percent}% completado · ${remaining} XP para la meta`}
          </Text>

          {top3.length > 0 && (
            <View style={s.lbDivider}>
              <Text style={s.lbSectionLabel}>Top semanal</Text>
              {top3.map((entry, idx) => {
                const isMe = entry.userId === myUserId;
                return (
                  <View key={entry.userId} style={s.lbRow}>
                    <Text style={s.lbRank}>{idx + 1}</Text>
                    <View style={[s.lbAvatar, isMe && s.lbAvatarMe]}>
                      <Text style={[s.lbAvatarText, isMe && s.lbAvatarTextMe]}>
                        {isMe ? "TÚ" : getInitials(entry.displayName)}
                      </Text>
                    </View>
                    <Text style={[s.lbName, isMe && s.lbNameMe]}>
                      {isMe ? "Tú" : entry.displayName}
                    </Text>
                    <Text style={[s.lbPts, isMe && s.lbPtsMe]}>
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

// ---------------------------------------------------------------------------

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
  const s = makeStyles(theme);

  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>Racha diaria</Text>
      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={s.streakMain}>
            <Text style={s.streakNumber}>{streak.currentStreak}</Text>
            <Text style={s.streakFire}>🔥</Text>
            <View style={s.streakInfo}>
              {streak.isActiveToday ? (
                <Text style={s.streakStatusOk}>¡Hoy ya sumaste actividad!</Text>
              ) : streak.isAtRisk ? (
                <Text style={s.streakStatusRisk}>¡En riesgo! Completa algo hoy</Text>
              ) : (
                <Text style={s.streakStatusNeutral}>
                  {streak.currentStreak > 0
                    ? "¡Vamos por una nueva racha!"
                    : "Aún no tienes actividad."}
                </Text>
              )}
              <Text style={s.streakSub}>
                {streak.lastActiveDate
                  ? `Última actividad: ${formatLocalDate(streak.lastActiveDate)}`
                  : "Sin actividad registrada"}
              </Text>
            </View>
          </View>

          {streak.recent7Days.length > 0 && (
            <View style={s.weekRow}>
              {streak.recent7Days.map((day) => (
                <View
                  key={day.dateKey}
                  style={[s.dayPill, day.isActive && s.dayPillActive]}
                >
                  <Text style={[s.dayPillText, day.isActive && s.dayPillTextActive]}>
                    {formatWeekday(day.dateKey)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {streak.isAtRisk && (
            <Pressable
              style={({ pressed }) => [s.streakCta, pressed && { opacity: 0.75 }]}
              onPress={onGoToTasks}
            >
              <Text style={s.streakCtaText}>Completar tarea hoy</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------

function LevelCard({
  isLoading,
  xp,
}: {
  isLoading: boolean;
  xp: XpSummary;
}) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const remaining = xp.xpNeededForNextLevel - xp.xpInCurrentLevel;

  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>Nivel</Text>
      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={s.levelRow}>
            <View style={s.levelBadge}>
              <Text style={s.levelBadgeText}>{xp.levelName}</Text>
            </View>
            <View style={s.levelInfo}>
              <Text style={s.levelName}>Rango {xp.levelName}</Text>
              <Text style={s.levelXpLabel}>{xp.totalXp} XP acumulados</Text>
            </View>
          </View>
          <View style={s.track}>
            <View
              style={[s.trackFillPrimary, { width: `${xp.progressPercent}%` as any }]}
            />
          </View>
          {xp.isMaxLevel ? (
            <Text style={s.levelMaxText}>Nivel máximo alcanzado 🎉</Text>
          ) : (
            <View style={s.levelNextRow}>
              <Text style={s.levelNextText}>
                {xp.xpInCurrentLevel} / {xp.xpNeededForNextLevel} XP
              </Text>
              <Text style={s.levelNextHighlight}>{remaining} XP para subir</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { activeGroupId, activeGroupName } = useAppSession();

  const [myPoints, setMyPoints] = useState(0);
  const [myWeeklyEarned, setMyWeeklyEarned] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<GroupPointsEntry[]>([]);
  const [streak, setStreak] = useState<StreakSummary>(DEFAULT_STREAK);
  const [xp, setXp] = useState<XpSummary>(DEFAULT_XP);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const prevRankRef = useRef<{ groupId: string; levelNumber: number } | null>(null);

  const handleGoToTasks = useCallback(() => {
    navigation.getParent()?.navigate("Tasks");
  }, [navigation]);

  const handleGoToHistory = useCallback(() => {
    navigation.navigate("PointHistory");
  }, [navigation]);

  const loadData = useCallback(async () => {
    if (!activeGroupId) {
      prevRankRef.current = null;
      setMyPoints(0);
      setMyWeeklyEarned(0);
      setMyUserId(null);
      setWeeklyLeaderboard([]);
      setStreak(DEFAULT_STREAK);
      setXp(DEFAULT_XP);
      setIsLoading(false);
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const [balance, weekEarned, weekRanking, userId, myXp] = await Promise.all([
        getMyPointsBalance(activeGroupId),
        getMyWeeklyPointsEarned(activeGroupId),
        getWeeklyGroupPointsLeaderboard(activeGroupId),
        getCurrentUserIdForPoints(),
        getMyXpSummary(activeGroupId),
      ]);

      let myStreak: StreakSummary = DEFAULT_STREAK;
      try {
        myStreak = await getMyStreakSummary(activeGroupId);
      } catch {
        // streak es no-crítico — falla silenciosamente
      }

      setMyPoints(balance);
      setMyWeeklyEarned(weekEarned);
      setWeeklyLeaderboard(weekRanking);
      setMyUserId(userId);
      setStreak(myStreak);
      setXp(myXp);

      const prev = prevRankRef.current;
      if (prev && prev.groupId === activeGroupId && myXp.currentLevel > prev.levelNumber) {
        // TODO: mostrar toast o modal de subida de nivel
      }
      prevRankRef.current = { groupId: activeGroupId, levelNumber: myXp.currentLevel };
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los datos del grupo."
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
    <ScrollView contentContainerStyle={s.container}>
      <Header
        groupName={activeGroupName}
        points={myPoints}
        weeklyEarned={myWeeklyEarned}
        isLoading={isLoading}
        onReload={loadData}
      />

      <WeeklyProgressCard
        isLoading={isLoading}
        earned={myWeeklyEarned}
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
        style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.75 }]}
        onPress={handleGoToHistory}
      >
        <Text style={s.ctaBtnText}>Ver historial de puntos</Text>
      </Pressable>

      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </ScrollView>
    </SafeAreaView>
  );
}