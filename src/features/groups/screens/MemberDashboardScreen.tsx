import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import shadows from "../../../../design-system-rn/tokens/shadows";
import { Button, GameBadge, StatCard } from "../../../../design-system-rn/components";
import { ProfileStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { ensureSupabase } from "../../../core/supabase/client";
import {
  CelebrationOverlay,
  type CelebrationData,
} from "../../../components/ui/CelebrationOverlay";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import {
  listGroupRewards,
  redeemRewardForMember,
} from "../../rewards/services/rewards.service";
import type { Reward } from "../../rewards/types";

type Props = NativeStackScreenProps<ProfileStackParamList, "MemberDashboard">;

type AvailableTask = {
  id: string;
  title: string;
  points_value: number;
  description: string | null;
};

type Transaction = {
  amount: number;
  reason: string;
  created_at: string;
};

type MemberOverview = {
  total_points: number;
  week_points: number;
  recent: Transaction[];
  pending_tasks: number;
  tasks: AvailableTask[];
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  sub_owner: "Sub-propietario",
  member: "Miembro",
};

function formatReason(reason: string): string {
  if (reason.startsWith("task_approved:"))  return "Tarea aprobada";
  if (reason.startsWith("reward_redeemed:")) return "Premio canjeado";
  if (reason.startsWith("manual:"))          return reason.slice("manual:".length);
  return reason;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function MemberDashboardScreen({ route }: Props) {
  const { memberId, memberName, memberRole } = route.params;
  const { activeGroupId } = useAppSession();
  const { colors } = useTheme();

  const [data, setData]                       = useState<MemberOverview | null>(null);
  const [isLoading, setIsLoading]             = useState(true);
  const [error, setError]                     = useState("");
  const [completing, setCompleting]           = useState<string | null>(null);
  const [rewards, setRewards]                 = useState<Reward[]>([]);
  const [redeeming, setRedeeming]             = useState<string | null>(null);
  const [confirmReward, setConfirmReward]     = useState<Reward | null>(null);
  const [celebration, setCelebration]         = useState<CelebrationData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const load = useCallback(async () => {
    if (!activeGroupId) return;
    try {
      setIsLoading(true);
      setError("");
      const client = ensureSupabase();
      const [{ data: rpcData, error: rpcError }, rewardList] = await Promise.all([
        client.rpc("get_member_overview", { p_user_id: memberId, p_group_id: activeGroupId }),
        listGroupRewards(activeGroupId),
      ]);
      if (rpcError) throw rpcError;
      setData(rpcData as MemberOverview);
      setRewards(rewardList);
    } catch {
      setError("No se pudo cargar la información del miembro.");
    } finally {
      setIsLoading(false);
    }
  }, [memberId, activeGroupId]);

  useEffect(() => { load(); }, [load]);

  const handleCompleteTask = useCallback(async (task: AvailableTask) => {
    if (!activeGroupId || completing) return;
    try {
      setCompleting(task.id);
      const client = ensureSupabase();
      const { data: result, error: rpcError } = await client.rpc(
        "complete_task_for_member",
        { p_task_id: task.id, p_member_id: memberId, p_group_id: activeGroupId },
      );
      if (rpcError) throw rpcError;
      const res = result as { points_earned: number; new_balance: number; task_title: string };
      setCelebration({ memberName, taskTitle: res.task_title, pointsEarned: res.points_earned, newBalance: res.new_balance });
      setShowCelebration(true);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total_points: res.new_balance,
          week_points: prev.week_points + res.points_earned,
          tasks: prev.tasks.filter((t) => t.id !== task.id),
        };
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo completar la tarea.";
      setError(msg === "already_completed" ? "Esta tarea ya fue completada." : msg);
    } finally {
      setCompleting(null);
    }
  }, [activeGroupId, memberId, memberName, completing]);

  const handleConfirmRedeem = useCallback(async () => {
    if (!activeGroupId || !confirmReward || redeeming) return;
    const reward = confirmReward;
    setConfirmReward(null);
    try {
      setRedeeming(reward.id);
      const result = await redeemRewardForMember(activeGroupId, reward.id, memberId);
      setData((prev) => prev ? { ...prev, total_points: result.newBalance } : prev);
      setCelebration({ memberName, taskTitle: result.rewardTitle, pointsEarned: -result.pointsSpent, newBalance: result.newBalance });
      setShowCelebration(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo realizar el canje.");
    } finally {
      setRedeeming(null);
    }
  }, [activeGroupId, confirmReward, memberId, memberName, redeeming]);

  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
          <Ionicons name="alert-circle-outline" size={26} color={colors.error} />
        </View>
        <Text className="font-sans text-sm text-destructive text-center">{error}</Text>
      </View>
    );
  }

  const balance = data?.total_points ?? 0;
  const weekPoints = data?.week_points ?? 0;
  const initial = (memberName ?? "?").charAt(0).toUpperCase();

  return (
    <>
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <ConfirmDialog
          visible={!!confirmReward}
          title="¿Confirmar canje?"
          message={`Se descontarán ${confirmReward?.costPoints} puntos a ${memberName} por "${confirmReward?.title}".`}
          confirmText="Confirmar"
          onConfirm={handleConfirmRedeem}
          onCancel={() => setConfirmReward(null)}
        />

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={shadows.card} className="mb-4 rounded-2xl border border-border bg-card p-5 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/15 mb-3">
              <Text className="font-sans-bold text-3xl text-primary">{initial}</Text>
            </View>
            <Text className="font-sans-bold text-xl text-foreground mb-1">{memberName}</Text>
            <View className="rounded-full bg-primary/15 px-3 py-0.5">
              <Text className="font-sans-medium text-xs text-primary">
                {ROLE_LABELS[memberRole] ?? memberRole}
              </Text>
            </View>
          </View>

          {/* Pending tasks warning */}
          {(data?.pending_tasks ?? 0) > 0 ? (
            <View className="mb-4 flex-row items-center gap-2 rounded-xl bg-warning/15 p-3">
              <Ionicons name="time-outline" size={16} color={colors.warning} />
              <Text className="flex-1 font-sans text-sm text-warning">
                {data!.pending_tasks} tarea{data!.pending_tasks > 1 ? "s" : ""} enviada{data!.pending_tasks > 1 ? "s" : ""} esperando aprobación
              </Text>
            </View>
          ) : null}

          {error ? (
            <View className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
              <Text className="font-sans-medium text-center text-sm text-destructive">{error}</Text>
            </View>
          ) : null}

          {/* Stats */}
          <View className="mb-4 flex-row gap-3">
            <StatCard
              style={{ flex: 1 }}
              icon={<Ionicons name="star-outline" size={18} color={colors.reward} />}
              label="Puntos totales"
              value={balance}
              colorClass="text-points"
            />
            <StatCard
              style={{ flex: 1 }}
              icon={<Ionicons name="trending-up-outline" size={18} color={colors.success} />}
              label="Esta semana"
              value={weekPoints}
              colorClass="text-success"
              trend={weekPoints > 0 ? "up" : "neutral"}
            />
          </View>

          {/* Tareas disponibles */}
          <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Tareas disponibles
          </Text>
          <View style={shadows.card} className="mb-4 overflow-hidden rounded-2xl border border-border bg-card">
            {(data?.tasks ?? []).length === 0 ? (
              <View className="items-center p-6">
                <Ionicons name="checkmark-done-outline" size={28} color={colors.muted} />
                <Text className="mt-2 font-sans text-sm text-muted-foreground text-center">
                  No hay tareas pendientes
                </Text>
              </View>
            ) : (
              (data?.tasks ?? []).map((task, i) => {
                const isCompleting = completing === task.id;
                return (
                  <View
                    key={task.id}
                    className={`flex-row items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <View className="flex-1">
                      <Text className="font-sans-medium text-sm text-foreground">{task.title}</Text>
                      {task.description ? (
                        <Text className="mt-0.5 font-sans text-xs text-muted-foreground" numberOfLines={1}>
                          {task.description}
                        </Text>
                      ) : null}
                    </View>
                    <GameBadge type="points" value={`+${task.points_value}`} size="sm" />
                    <Button
                      label={isCompleting ? "..." : "Hecho"}
                      variant="primary"
                      size="sm"
                      disabled={!!completing}
                      onPress={() => handleCompleteTask(task)}
                      iconLeft={
                        isCompleting ? undefined : (
                          <Ionicons name="checkmark" size={13} color={colors.primaryText} />
                        )
                      }
                    />
                  </View>
                );
              })
            )}
          </View>

          {/* Canjear premio */}
          {rewards.length > 0 ? (
            <>
              <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Canjear premio
              </Text>
              <View style={shadows.card} className="mb-4 overflow-hidden rounded-2xl border border-border bg-card">
                {rewards.map((reward, i) => {
                  const canAfford = balance >= reward.costPoints;
                  const isRedeeming = redeeming === reward.id;
                  return (
                    <View
                      key={reward.id}
                      className={`flex-row items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                    >
                      <Text className={`flex-1 font-sans-medium text-sm ${canAfford ? "text-foreground" : "text-muted-foreground"}`}>
                        {reward.title}
                      </Text>
                      <GameBadge type="points" value={`${reward.costPoints} pts`} size="sm" />
                      <Button
                        label={isRedeeming ? "..." : "Canjear"}
                        variant="outline"
                        size="sm"
                        disabled={!canAfford || !!redeeming}
                        onPress={() => canAfford && !redeeming && setConfirmReward(reward)}
                      />
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          {/* Actividad reciente */}
          <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Actividad reciente
          </Text>
          <View style={shadows.card} className="overflow-hidden rounded-2xl border border-border bg-card">
            {(data?.recent ?? []).length === 0 ? (
              <View className="items-center p-6">
                <Ionicons name="receipt-outline" size={28} color={colors.muted} />
                <Text className="mt-2 font-sans text-sm text-muted-foreground text-center">
                  Sin actividad aún
                </Text>
              </View>
            ) : (
              (data?.recent ?? []).map((tx, i) => {
                const isPositive = tx.amount > 0;
                return (
                  <View
                    key={i}
                    className={`flex-row items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <View className={`h-2 w-2 rounded-full ${isPositive ? "bg-success" : "bg-destructive"}`} />
                    <Text className="flex-1 font-sans text-sm text-foreground" numberOfLines={1}>
                      {formatReason(tx.reason)}
                    </Text>
                    <Text className={`font-mono-bold text-sm ${isPositive ? "text-success" : "text-destructive"}`}>
                      {isPositive ? "+" : ""}{tx.amount}
                    </Text>
                    <Text className="font-sans text-[11px] text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <CelebrationOverlay
        visible={showCelebration}
        data={celebration}
        onClose={handleCloseCelebration}
      />
    </>
  );
}
