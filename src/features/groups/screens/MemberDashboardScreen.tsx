import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { ensureSupabase } from "../../../core/supabase/client";
import {
  CelebrationOverlay,
  type CelebrationData,
} from "../../../components/ui/CelebrationOverlay";
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
  owner: "Propietario", sub_owner: "Sub-propietario", member: "Miembro",
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

const sectionTitle = "text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-2";

export function MemberDashboardScreen({ route }: Props) {
  const { memberId, memberName, memberRole } = route.params;
  const { activeGroupId } = useAppSession();
  const { colors } = useTheme();

  const [data, setData]               = useState<MemberOverview | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState("");
  const [completing, setCompleting]   = useState<string | null>(null);
  const [rewards, setRewards]         = useState<Reward[]>([]);
  const [redeeming, setRedeeming]     = useState<string | null>(null);
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [celebration, setCelebration]       = useState<CelebrationData | null>(null);
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
        return { ...prev, total_points: res.new_balance, week_points: prev.week_points + res.points_earned, tasks: prev.tasks.filter((t) => t.id !== task.id) };
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
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-sm text-destructive">{error}</Text>
      </View>
    );
  }

  const balance = data?.total_points ?? 0;
  const initial = (memberName ?? "?").charAt(0).toUpperCase();

  return (
    <>
      <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top"]}>
        <ScrollView style={{ padding: 16, paddingBottom: 40 }}>

          {/* Header */}
          <View className="bg-primary rounded-[20px] p-5 items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            >
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#fff" }}>{initial}</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 4 }}>
              {memberName}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
              {ROLE_LABELS[memberRole] ?? memberRole}
            </Text>
          </View>

          {/* Pending tasks warning */}
          {(data?.pending_tasks ?? 0) > 0 ? (
            <View className="flex-row items-center bg-warning/15 rounded-xl p-3 mb-4 gap-2">
              <Text className="text-sm text-warning flex-1">
                {data!.pending_tasks} tarea{data!.pending_tasks > 1 ? "s" : ""} enviada{data!.pending_tasks > 1 ? "s" : ""} esperando aprobación
              </Text>
            </View>
          ) : null}

          {error ? (
            <Text className="text-destructive text-sm text-center mb-3">{error}</Text>
          ) : null}

          {/* Stats */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-card border border-border rounded-xl p-4 items-center">
              <Text className="text-[22px] font-sans-bold text-foreground mb-[2px]">{balance}</Text>
              <Text className="text-[11px] text-muted-foreground text-center">Puntos totales</Text>
            </View>
            <View className="flex-1 bg-card border border-border rounded-xl p-4 items-center">
              <Text className="text-[22px] font-sans-bold text-success mb-[2px]">{data?.week_points ?? 0}</Text>
              <Text className="text-[11px] text-muted-foreground text-center">Esta semana</Text>
            </View>
          </View>

          {/* Available tasks */}
          <Text className={sectionTitle}>Tareas disponibles</Text>
          <View className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
            {(data?.tasks ?? []).length === 0 ? (
              <Text className="text-sm text-muted-foreground text-center p-4">¡No hay tareas pendientes!</Text>
            ) : (
              (data?.tasks ?? []).map((task, i) => {
                const isCompleting = completing === task.id;
                return (
                  <View
                    key={task.id}
                    className={`flex-row items-center px-4 py-3 gap-3 ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-sans-medium text-foreground">{task.title}</Text>
                      {task.description ? (
                        <Text className="text-xs text-muted-foreground mt-[2px]" numberOfLines={1}>
                          {task.description}
                        </Text>
                      ) : null}
                    </View>
                    <View className="bg-primary/15 rounded-full px-2" style={{ paddingVertical: 3 }}>
                      <Text className="text-xs font-sans-bold text-primary">+{task.points_value} pts</Text>
                    </View>
                    <Pressable
                      className={`bg-success rounded-xl px-3 py-2 active:opacity-75 ${(isCompleting || !!completing) ? "opacity-40" : ""}`}
                      onPress={() => handleCompleteTask(task)}
                      disabled={!!completing}
                    >
                      <Text className="text-xs font-sans-bold text-primary-foreground">
                        {isCompleting ? "..." : "✓ Hecho"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>

          {/* Redeem reward */}
          {rewards.length > 0 && (
            <>
              <Text className={sectionTitle}>Canjear premio</Text>
              <View className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
                {rewards.map((reward, i) => {
                  const canAfford = balance >= reward.costPoints;
                  const isRedeeming = redeeming === reward.id;
                  return (
                    <View
                      key={reward.id}
                      className={`flex-row items-center px-4 py-3 gap-3 ${i > 0 ? "border-t border-border" : ""}`}
                    >
                      <View className="flex-1">
                        <Text className={`text-sm font-sans-medium ${!canAfford ? "text-muted-foreground" : "text-foreground"}`}>
                          {reward.title}
                        </Text>
                      </View>
                      <View className="bg-points/15 rounded-full px-2" style={{ paddingVertical: 3 }}>
                        <Text className="text-xs font-sans-bold text-points">{reward.costPoints} pts</Text>
                      </View>
                      <Pressable
                        className={`bg-points rounded-xl px-3 py-2 active:opacity-75 ${(!canAfford || !!redeeming) ? "opacity-35" : ""}`}
                        onPress={() => canAfford && !redeeming && setConfirmReward(reward)}
                        disabled={!canAfford || !!redeeming}
                      >
                        <Text className="text-xs font-sans-bold text-primary-foreground">
                          {isRedeeming ? "..." : "Canjear"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Recent activity */}
          <Text className={sectionTitle}>Actividad reciente</Text>
          <View className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
            {(data?.recent ?? []).length === 0 ? (
              <Text className="text-sm text-muted-foreground text-center p-4">Sin actividad aún.</Text>
            ) : (
              (data?.recent ?? []).map((tx, i) => {
                const isPositive = tx.amount > 0;
                return (
                  <View
                    key={i}
                    className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <View className={`w-2 h-2 rounded-full mr-3 ${isPositive ? "bg-success" : "bg-destructive"}`} />
                    <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                      {formatReason(tx.reason)}
                    </Text>
                    <Text className={`text-sm font-sans-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                      {isPositive ? "+" : ""}{tx.amount}
                    </Text>
                    <Text className="text-[11px] text-muted-foreground ml-2">
                      {formatDate(tx.created_at)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Confirmation modal */}
      <Modal
        visible={!!confirmReward}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmReward(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
          onPress={() => setConfirmReward(null)}
        >
          <Pressable
            className="bg-background rounded-t-[20px] p-5"
            style={{ paddingBottom: 40 }}
            onPress={() => {}}
          >
            <Text className="text-base font-sans-semibold text-foreground mb-2">
              ¿Confirmar canje?
            </Text>
            <Text className="text-sm text-muted-foreground mb-5">
              Se descontarán {confirmReward?.costPoints} puntos a {memberName} por "{confirmReward?.title}".
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 rounded-xl py-4 items-center bg-card border border-border active:opacity-70"
                onPress={() => setConfirmReward(null)}
              >
                <Text className="text-sm text-foreground">Cancelar</Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-xl py-4 items-center bg-points active:opacity-75"
                onPress={handleConfirmRedeem}
              >
                <Text className="text-sm font-sans-bold text-primary-foreground">Confirmar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <CelebrationOverlay
        visible={showCelebration}
        data={celebration}
        onClose={handleCloseCelebration}
      />
    </>
  );
}
