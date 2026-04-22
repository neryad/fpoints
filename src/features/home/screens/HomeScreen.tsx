import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../../components/ui/Button";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { SkeletonLoader } from "../../../components/ui/SkeletonLoader";
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
  return (
    <View className="items-center pt-4 pb-5 relative">
      {groupName ? (
        <Text
          className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-1"
          numberOfLines={1}
        >
          {groupName}
        </Text>
      ) : null}
      <Text className="text-[52px] font-sans-bold text-foreground leading-[58px] mb-2">
        {isLoading ? "--" : points}
      </Text>
      {!isLoading && weeklyEarned > 0 && (
        <View className="flex-row items-center bg-success/15 px-3 py-1 rounded-full">
          <Text className="text-xs font-sans-semibold text-success">
            ↑ +{weeklyEarned} esta semana
          </Text>
        </View>
      )}
      <Pressable
        className="absolute right-0 top-4 w-9 h-9 rounded-full bg-muted border border-border items-center justify-center active:opacity-60"
        onPress={onReload}
        disabled={isLoading}
        accessibilityLabel="Recargar datos"
      >
        <Text className="text-base text-muted-foreground">↻</Text>
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
  const percent = Math.min(100, Math.round((earned / WEEKLY_XP_GOAL) * 100));
  const remaining = Math.max(0, WEEKLY_XP_GOAL - earned);
  const top3 = weeklyLeaderboard.slice(0, 3);

  return (
    <View className="bg-card border border-border rounded-xl p-4 mb-3">
      <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-3">
        Progreso semanal
      </Text>
      {isLoading ? (
        <SkeletonLoader variant="card" count={1} />
      ) : (
        <>
          <View className="flex-row justify-between items-end mb-2">
            <Text className="text-[22px] font-sans-semibold text-foreground">
              {earned}{" "}
              <Text className="text-sm font-sans text-muted-foreground">
                / {WEEKLY_XP_GOAL} XP
              </Text>
            </Text>
            <Text className="text-xs text-muted-foreground">Meta semanal</Text>
          </View>
          <ProgressBar progress={earned / WEEKLY_XP_GOAL} variant="xp" />
          <Text className="text-[11px] text-muted-foreground mb-4">
            {earned >= WEEKLY_XP_GOAL
              ? `¡Meta alcanzada! (${WEEKLY_XP_GOAL} XP)`
              : `${percent}% completado · ${remaining} XP para la meta`}
          </Text>

          {top3.length > 0 && (
            <View className="border-t border-border pt-3">
              <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-2">
                Top semanal
              </Text>
              {top3.map((entry, idx) => {
                const isMe = entry.userId === myUserId;
                return (
                  <View key={entry.userId} className="flex-row items-center gap-2 py-1">
                    <Text className="text-[11px] text-muted-foreground w-5 text-center">
                      {idx + 1}
                    </Text>
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center ${
                        isMe ? "bg-success/15" : "bg-primary/15"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-sans-semibold ${
                          isMe ? "text-success" : "text-primary"
                        }`}
                      >
                        {isMe ? "TÚ" : getInitials(entry.displayName)}
                      </Text>
                    </View>
                    <Text
                      className={`flex-1 text-sm ${
                        isMe
                          ? "font-sans-semibold text-success"
                          : "font-sans text-foreground"
                      }`}
                    >
                      {isMe ? "Tú" : entry.displayName}
                    </Text>
                    <Text
                      className={`text-sm font-sans-semibold ${
                        isMe ? "text-success" : "text-foreground"
                      }`}
                    >
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
  const { colors } = useTheme();

  return (
    <View className="bg-card border border-border rounded-xl p-4 mb-3">
      <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-3">
        Racha diaria
      </Text>
      {isLoading ? (
        <SkeletonLoader variant="card" count={1} />
      ) : (
        <>
          <View className="flex-row items-center gap-3 mb-3">
            <Text className="text-[36px] font-sans-bold text-foreground leading-[40px]">
              {streak.currentStreak}
            </Text>
            <Ionicons name="flame" size={30} color={colors.streak} />
            <View className="flex-1">
              {streak.isActiveToday ? (
                <Text className="text-sm font-sans-semibold text-success mb-[2px]">
                  ¡Hoy ya sumaste actividad!
                </Text>
              ) : streak.isAtRisk ? (
                <Text className="text-sm font-sans-semibold text-warning mb-[2px]">
                  ¡En riesgo! Completa algo hoy
                </Text>
              ) : (
                <Text className="text-sm text-muted-foreground mb-[2px]">
                  {streak.currentStreak > 0
                    ? "¡Vamos por una nueva racha!"
                    : "Aún no tienes actividad."}
                </Text>
              )}
              <Text className="text-[11px] text-muted-foreground">
                {streak.lastActiveDate
                  ? `Última actividad: ${formatLocalDate(streak.lastActiveDate)}`
                  : "Sin actividad registrada"}
              </Text>
            </View>
          </View>

          {streak.recent7Days.length > 0 && (
            <View className="flex-row gap-1">
              {streak.recent7Days.map((day) => (
                <View
                  key={day.dateKey}
                  className={`flex-1 h-[30px] rounded items-center justify-center border ${
                    day.isActive
                      ? "bg-success/15 border-success"
                      : "bg-muted border-border"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-sans-bold ${
                      day.isActive ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {formatWeekday(day.dateKey)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {streak.isAtRisk && (
            <View className="mt-4">
              <Button
                label="Completar tarea hoy"
                onPress={onGoToTasks}
                variant="primary"
                size="md"
              />
            </View>
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
  const remaining = xp.xpNeededForNextLevel - xp.xpInCurrentLevel;

  return (
    <View className="bg-card border border-border rounded-xl p-4 mb-3">
      <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-3">
        Nivel
      </Text>
      {isLoading ? (
        <SkeletonLoader variant="card" count={1} />
      ) : (
        <>
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-[46px] h-[46px] rounded-full bg-primary/15 border border-primary items-center justify-center">
              <Text className="text-lg font-sans-bold text-primary">
                {xp.levelName}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-sans-semibold text-foreground mb-[2px]">
                Rango {xp.levelName}
              </Text>
              <Text className="text-[11px] text-muted-foreground">
                {xp.totalXp} XP acumulados
              </Text>
            </View>
          </View>
          <ProgressBar progress={xp.progressPercent / 100} variant="xp" />
          {xp.isMaxLevel ? (
            <Text className="text-[11px] text-success text-center mt-1">
              ¡Nivel máximo alcanzado!
            </Text>
          ) : (
            <View className="flex-row justify-between mt-1">
              <Text className="text-[11px] text-muted-foreground">
                {xp.xpInCurrentLevel} / {xp.xpNeededForNextLevel} XP
              </Text>
              <Text className="text-[11px] font-sans-semibold text-foreground">
                {remaining} XP para subir
              </Text>
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
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top"]}>
      <ScrollView
        className="bg-background"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 }}
      >
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

        <Button
          label="Ver historial de puntos"
          onPress={handleGoToHistory}
          variant="secondary"
          size="lg"
        />

        {error ? (
          <Text className="mt-4 text-destructive text-center text-sm font-sans-medium">
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
