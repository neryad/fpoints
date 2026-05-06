import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Button, StatCard, XpProgress } from "../../../../design-system-rn/components";
import shadows from "../../../../design-system-rn/tokens/shadows";
import { HomeStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import {
  getCurrentUserIdForPoints,
  getMyPointsBalance,
  getMyWeeklyPointsEarned,
  getWeeklyGroupPointsLeaderboard,
  type GroupPointsEntry,
} from "../services/points.service";
import { getMyStreakSummary, type StreakSummary } from "../../gamification/services/streak.service";
import { getMyXpSummary, type XpSummary } from "../../gamification/services/xp.service";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeDashboard">;

const WEEKLY_POINTS_GOAL = 200;

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

/* -------------------------------------------------------------------------- */
/*  SECTION CARD                                                               */
/* -------------------------------------------------------------------------- */

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={shadows.card} className="rounded-2xl border border-border bg-card p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-sans-semibold text-sm text-foreground">{title}</Text>
      </View>
      {children}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  HEADER                                                                     */
/* -------------------------------------------------------------------------- */

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
  const { colors } = useTheme();
  return (
    <View className="mb-4 flex-row items-start justify-between">
      <View className="flex-1">
        {groupName ? (
          <Text className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
            {groupName}
          </Text>
        ) : null}
        <Text className="font-sans text-sm text-muted-foreground">Tus puntos</Text>
        <Text
          className="font-mono-bold text-4xl text-points"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {isLoading ? "--" : points}
        </Text>
        {!isLoading && weeklyEarned > 0 ? (
          <View className="mt-1 self-start rounded-full bg-success/15 px-2 py-0.5">
            <Text className="font-mono-bold text-[11px] text-success">
              ↑ +{weeklyEarned} esta semana
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onReload}
        className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
      >
        <Ionicons name="refresh" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  WEEKLY PROGRESS                                                            */
/* -------------------------------------------------------------------------- */

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
  const percent = Math.min(100, Math.round((earned / WEEKLY_POINTS_GOAL) * 100));
  const remaining = Math.max(0, WEEKLY_POINTS_GOAL - earned);
  const top3 = weeklyLeaderboard.slice(0, 3);

  return (
    <SectionCard title="Progreso semanal">
      {isLoading ? (
        <View className="h-24 rounded-lg bg-muted/50" />
      ) : (
        <>
          <View className="mb-2">
            <Text
              className="font-mono-bold text-2xl text-foreground"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {earned}
              <Text className="font-mono text-sm text-muted-foreground"> / {WEEKLY_POINTS_GOAL} pts</Text>
            </Text>
            <Text className="font-sans text-xs text-muted-foreground">Meta semanal</Text>
          </View>

          <View className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <View className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </View>

          <Text className="font-sans text-[11px] text-muted-foreground">
            {earned >= WEEKLY_POINTS_GOAL
              ? `¡Meta alcanzada! (${WEEKLY_POINTS_GOAL} pts)`
              : `${percent}% completado · ${remaining} pts para la meta`}
          </Text>

          {top3.length > 0 ? (
            <View className="mt-4 border-t border-border pt-3">
              <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Top semanal
              </Text>
              {top3.map((entry, idx) => {
                const isMe = entry.userId === myUserId;
                return (
                  <View
                    key={entry.userId}
                    className={`mb-1.5 flex-row items-center rounded-lg px-2 py-1.5 ${isMe ? "bg-primary/10" : ""}`}
                  >
                    <Text
                      className="w-6 font-mono-bold text-sm text-muted-foreground"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {idx + 1}
                    </Text>
                    <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <Text className="font-sans-bold text-[10px] text-foreground">
                        {isMe ? "TÚ" : getInitials(entry.displayName)}
                      </Text>
                    </View>
                    <Text className="flex-1 font-sans text-sm text-foreground">
                      {isMe ? "Tú" : entry.displayName}
                    </Text>
                    <Text
                      className="font-mono-bold text-sm text-points"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {entry.points} pts
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </>
      )}
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  STREAK                                                                     */
/* -------------------------------------------------------------------------- */

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
  const hasStreak = streak.currentStreak > 0;

  return (
    <SectionCard title="Racha diaria">
      {isLoading ? (
        <View className="h-24 rounded-lg bg-muted/50" />
      ) : (
        <>
          <View className="flex-row items-center">
            <View
              className={`mr-3 h-14 w-14 items-center justify-center rounded-full border-2 ${hasStreak ? "bg-streak/15 border-streak" : "bg-muted/30 border-muted"}`}
            >
              <Ionicons name="flame" size={22} color={hasStreak ? colors.streak : colors.muted} />
              <Text
                className={`font-mono-bold text-xs ${hasStreak ? "text-streak" : "text-muted-foreground"}`}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {streak.currentStreak}
              </Text>
            </View>
            <View className="flex-1">
              {streak.isActiveToday ? (
                <Text className="font-sans-semibold text-sm text-success">
                  ¡Hoy ya sumaste actividad!
                </Text>
              ) : streak.isAtRisk ? (
                <Text className="font-sans-semibold text-sm text-destructive">
                  ¡En riesgo! Completa algo hoy
                </Text>
              ) : (
                <Text className="font-sans-semibold text-sm text-foreground">
                  {streak.currentStreak > 0 ? "¡Vamos por una nueva racha!" : "Aún no tienes actividad."}
                </Text>
              )}
              <Text className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                {streak.lastActiveDate
                  ? `Última: ${formatLocalDate(streak.lastActiveDate)}`
                  : "Sin actividad registrada"}
              </Text>
            </View>
          </View>

          {streak.recent7Days.length > 0 ? (
            <View className="mt-4 flex-row justify-between">
              {streak.recent7Days.map((day) => (
                <View key={day.dateKey} className="items-center">
                  <View
                    className={`h-7 w-7 items-center justify-center rounded-md ${day.isActive ? "bg-streak" : "bg-muted"}`}
                  >
                    {day.isActive ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : (
                      <Text className="font-mono-bold text-[10px] text-muted-foreground">·</Text>
                    )}
                  </View>
                  <Text className="mt-1 font-sans text-[9px] text-muted-foreground">
                    {formatWeekday(day.dateKey)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {streak.isAtRisk ? (
            <View className="mt-4">
              <Button
                label="Hacer una tarea ahora"
                variant="primary"
                size="md"
                fullWidth
                onPress={onGoToTasks}
              />
            </View>
          ) : null}
        </>
      )}
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  LEVEL / XP                                                                 */
/* -------------------------------------------------------------------------- */

function LevelCard({ isLoading, xp }: { isLoading: boolean; xp: XpSummary }) {
  const remaining = xp.xpNeededForNextLevel - xp.xpInCurrentLevel;

  return (
    <SectionCard title="Nivel">
      {isLoading ? (
        <View className="h-20 rounded-lg bg-muted/50" />
      ) : (
        <>
          <View className="mb-3 flex-row items-center">
            <View className="mr-3 h-14 w-14 items-center justify-center rounded-2xl bg-xp/15 border-2 border-xp">
              <Text className="font-mono-bold text-2xl text-xp">{xp.levelName}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans-bold text-base text-foreground">
                Rango {xp.levelName}
              </Text>
              <Text
                className="font-mono text-xs text-muted-foreground"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {xp.totalXp} XP acumulados
              </Text>
            </View>
          </View>

          {xp.isMaxLevel ? (
            <View className="rounded-lg bg-xp/10 p-3">
              <Text className="text-center font-sans-semibold text-sm text-xp">
                ¡Nivel máximo alcanzado!
              </Text>
            </View>
          ) : (
            <>
              <XpProgress
                level={xp.currentLevel}
                currentXp={xp.xpInCurrentLevel}
                requiredXp={xp.xpNeededForNextLevel}
              />
              <Text className="mt-2 text-right font-sans text-[11px] text-muted-foreground">
                {remaining} XP para subir
              </Text>
            </>
          )}
        </>
      )}
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  HOMESCREEN                                                                 */
/* -------------------------------------------------------------------------- */

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { activeGroupId, activeGroupName } = useAppSession();

  const [myPoints, setMyPoints] = useState(0);
  const [myWeeklyEarned, setMyWeeklyEarned] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<GroupPointsEntry[]>([]);
  const [streak, setStreak] = useState<StreakSummary>(DEFAULT_STREAK);
  const [xp, setXp] = useState<XpSummary>(DEFAULT_XP);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const handleGoToTasks = useCallback(() => {
    navigation.getParent()?.navigate("Tasks" as never);
  }, [navigation]);

  const handleGoToHistory = useCallback(() => {
    navigation.navigate("PointHistory");
  }, [navigation]);

  const loadData = useCallback(async () => {
    if (!activeGroupId) {
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

      const [balance, weekEarned, weekLeaderboard, userId, myXp, myStreak] = await Promise.all([
        getMyPointsBalance(activeGroupId),
        getMyWeeklyPointsEarned(activeGroupId),
        getWeeklyGroupPointsLeaderboard(activeGroupId),
        getCurrentUserIdForPoints(),
        getMyXpSummary(activeGroupId),
        getMyStreakSummary(activeGroupId),
      ]);

      setMyPoints(balance);
      setMyWeeklyEarned(weekEarned);
      setWeeklyLeaderboard(weekLeaderboard);
      setMyUserId(userId);
      setXp(myXp);
      setStreak(myStreak);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los datos.");
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Header
          groupName={activeGroupName}
          points={myPoints}
          weeklyEarned={myWeeklyEarned}
          isLoading={isLoading}
          onReload={loadData}
        />

        {/* Resumen rápido */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCard
              icon={<Ionicons name="flame" size={20} color={streak.currentStreak > 0 ? colors.streak : colors.muted} />}
              label="Racha"
              value={streak.currentStreak}
              subtitle={streak.isActiveToday ? "Activa hoy" : "Pendiente"}
              colorClass={streak.currentStreak > 0 ? "text-streak" : "text-muted-foreground"}
              trend={streak.isAtRisk ? "down" : "up"}
            />
          </View>
          <View className="flex-1">
            <StatCard
              icon={<Ionicons name="star" size={20} color={colors.xp} />}
              label="Nivel"
              value={xp.levelName}
              subtitle={`${xp.totalXp} XP`}
              colorClass="text-xp"
              trend="neutral"
            />
          </View>
        </View>

        <WeeklyProgressCard
          isLoading={isLoading}
          earned={myWeeklyEarned}
          weeklyLeaderboard={weeklyLeaderboard}
          myUserId={myUserId}
        />

        <LevelCard isLoading={isLoading} xp={xp} />

        <StreakCard
          isLoading={isLoading}
          streak={streak}
          onGoToTasks={handleGoToTasks}
        />

        {/* Acciones */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Ver historial"
              variant="outline"
              size="md"
              fullWidth
              onPress={handleGoToHistory}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Ir a tareas"
              variant="primary"
              size="md"
              fullWidth
              onPress={handleGoToTasks}
            />
          </View>
        </View>

        {error ? (
          <View className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <Text className="font-sans-medium text-sm text-destructive">{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;
