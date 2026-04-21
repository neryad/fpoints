import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
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

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;
  return StyleSheet.create({
    container:  { flex: 1, backgroundColor: colors.background },
    scroll:     { padding: spacing[4], paddingBottom: spacing[8] },
    centered:   { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },

    headerCard: {
      backgroundColor: colors.primary,
      borderRadius: radius.xl,
      padding: spacing[5],
      alignItems: "center",
      marginBottom: spacing[4],
    },
    avatar: {
      width: 64, height: 64, borderRadius: radius.full,
      backgroundColor: "rgba(255,255,255,0.25)",
      alignItems: "center", justifyContent: "center",
      marginBottom: spacing[3],
    },
    avatarText:  { fontSize: 28, fontWeight: fontWeight.bold, color: "#fff" },
    memberName:  { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: "#fff", marginBottom: spacing[1] },
    roleLabel:   { fontSize: fontSize.xs, color: "rgba(255,255,255,0.75)" },

    statsRow: { flexDirection: "row", gap: spacing[3], marginBottom: spacing[4] },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 0.5, borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing[4], alignItems: "center",
    },
    statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textStrong, marginBottom: 2 },
    statLabel: { fontSize: fontSize.xxs, color: colors.muted, textAlign: "center" },

    sectionTitle: {
      fontSize: fontSize.xxs, fontWeight: fontWeight.medium,
      color: colors.muted, letterSpacing: 0.8, textTransform: "uppercase",
      marginBottom: spacing[2],
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 0.5, borderColor: colors.border,
      borderRadius: radius.lg, marginBottom: spacing[4], overflow: "hidden",
    },

    // Task row
    taskRow: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: spacing[4], paddingVertical: spacing[3],
      borderTopWidth: 0.5, borderTopColor: colors.border,
      gap: spacing[3],
    },
    taskInfo:   { flex: 1 },
    taskTitle:  { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textStrong },
    taskDesc:   { fontSize: fontSize.xs, color: colors.muted, marginTop: 2 },
    taskPoints: {
      backgroundColor: colors.primarySoft, borderRadius: radius.full,
      paddingHorizontal: spacing[2], paddingVertical: 3,
    },
    taskPointsText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary },
    doneBtn: {
      backgroundColor: colors.success, borderRadius: radius.md,
      paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    },
    doneBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: "#fff" },
    doneBtnDisabled: { opacity: 0.4 },

    // Transaction row
    txRow: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: spacing[4], paddingVertical: spacing[3],
      borderTopWidth: 0.5, borderTopColor: colors.border,
    },
    txDot:    { width: 8, height: 8, borderRadius: 4, marginRight: spacing[3] },
    txReason: { flex: 1, fontSize: fontSize.sm, color: colors.text },
    txAmount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

    emptyText: { fontSize: fontSize.sm, color: colors.muted, textAlign: "center", padding: spacing[4] },

    pendingBanner: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.warningSoft, borderRadius: radius.lg,
      padding: spacing[3], marginBottom: spacing[4], gap: spacing[2],
    },
    pendingText: { fontSize: fontSize.sm, color: colors.warning, flex: 1 },
  });
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario", sub_owner: "Sub-propietario", member: "Miembro",
};

function formatReason(reason: string): string {
  if (reason.startsWith("task_approved:"))  return "Tarea aprobada";
  if (reason.startsWith("reward_redeemed:")) return "Recompensa canjeada";
  if (reason.startsWith("manual:"))          return reason.slice("manual:".length);
  return reason;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function MemberDashboardScreen({ route }: Props) {
  const { memberId, memberName, memberRole } = route.params;
  const { activeGroupId } = useAppSession();
  const theme = useTheme();
  const s = makeStyles(theme);
  const { colors, spacing, fontSize } = theme;

  const [data, setData]         = useState<MemberOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState("");
  const [completing, setCompleting] = useState<string | null>(null); // taskId being completed

  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const load = useCallback(async () => {
    if (!activeGroupId) return;
    try {
      setIsLoading(true);
      setError("");
      const client = ensureSupabase();
      const { data: rpcData, error: rpcError } = await client.rpc(
        "get_member_overview",
        { p_user_id: memberId, p_group_id: activeGroupId },
      );
      if (rpcError) throw rpcError;
      setData(rpcData as MemberOverview);
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
      setCelebration({
        memberName,
        taskTitle: res.task_title,
        pointsEarned: res.points_earned,
        newBalance: res.new_balance,
      });
      setShowCelebration(true);
      // Optimistically remove task and update points in local state
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

  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={s.centered}>
        <Text style={{ color: colors.error, fontSize: fontSize.sm }}>{error}</Text>
      </View>
    );
  }

  const initial = (memberName ?? "?").charAt(0).toUpperCase();

  return (
    <>
      <SafeAreaView style={s.container} edges={["top"]}>
        <ScrollView style={s.scroll}>

          {/* Header */}
          <View style={s.headerCard}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <Text style={s.memberName}>{memberName}</Text>
            <Text style={s.roleLabel}>{ROLE_LABELS[memberRole] ?? memberRole}</Text>
          </View>

          {/* Pending submissions warning */}
          {(data?.pending_tasks ?? 0) > 0 ? (
            <View style={s.pendingBanner}>
              <Text style={s.pendingText}>
                {data!.pending_tasks} tarea{data!.pending_tasks > 1 ? "s" : ""} enviada{data!.pending_tasks > 1 ? "s" : ""} esperando aprobación
              </Text>
            </View>
          ) : null}

          {/* Error inline */}
          {error ? (
            <Text style={{ color: colors.error, fontSize: fontSize.sm, marginBottom: spacing[3], textAlign: "center" }}>
              {error}
            </Text>
          ) : null}

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statValue}>{data?.total_points ?? 0}</Text>
              <Text style={s.statLabel}>Puntos totales</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statValue, { color: colors.success }]}>{data?.week_points ?? 0}</Text>
              <Text style={s.statLabel}>Esta semana</Text>
            </View>
          </View>

          {/* Available tasks */}
          <Text style={s.sectionTitle}>Tareas disponibles</Text>
          <View style={s.card}>
            {(data?.tasks ?? []).length === 0 ? (
              <Text style={s.emptyText}>¡No hay tareas pendientes! 🎉</Text>
            ) : (
              (data?.tasks ?? []).map((task, i) => {
                const isCompleting = completing === task.id;
                return (
                  <View key={task.id} style={[s.taskRow, i === 0 && { borderTopWidth: 0 }]}>
                    <View style={s.taskInfo}>
                      <Text style={s.taskTitle}>{task.title}</Text>
                      {task.description ? (
                        <Text style={s.taskDesc} numberOfLines={1}>{task.description}</Text>
                      ) : null}
                    </View>
                    <View style={s.taskPoints}>
                      <Text style={s.taskPointsText}>+{task.points_value} pts</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        s.doneBtn,
                        (isCompleting || !!completing) && s.doneBtnDisabled,
                        pressed && !completing && { opacity: 0.75 },
                      ]}
                      onPress={() => handleCompleteTask(task)}
                      disabled={!!completing}
                    >
                      <Text style={s.doneBtnText}>
                        {isCompleting ? "..." : "✓ Hecho"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>

          {/* Recent activity */}
          <Text style={s.sectionTitle}>Actividad reciente</Text>
          <View style={s.card}>
            {(data?.recent ?? []).length === 0 ? (
              <Text style={s.emptyText}>Sin actividad aún.</Text>
            ) : (
              (data?.recent ?? []).map((tx, i) => {
                const isPositive = tx.amount > 0;
                return (
                  <View key={i} style={[s.txRow, i === 0 && { borderTopWidth: 0 }]}>
                    <View style={[s.txDot, { backgroundColor: isPositive ? colors.success : colors.error }]} />
                    <Text style={s.txReason} numberOfLines={1}>{formatReason(tx.reason)}</Text>
                    <Text style={[s.txAmount, { color: isPositive ? colors.success : colors.error }]}>
                      {isPositive ? "+" : ""}{tx.amount}
                    </Text>
                    <Text style={{ fontSize: theme.fontSize.xxs, color: colors.muted, marginLeft: theme.spacing[2] }}>
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
