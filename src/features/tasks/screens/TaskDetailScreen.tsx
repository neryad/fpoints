import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TasksStackParamList } from "../../../app/navigation/types";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import {
  getMyRoleInGroup,
  getTask,
  listMyTaskSubmissions,
  listTaskSubmissions,
  reviewTaskSubmission,
} from "../services/tasks.service";
import type { Task, TaskSubmission } from "../types";

type Props = NativeStackScreenProps<TasksStackParamList, "TaskDetail">;

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

type SubmissionStatus = "pending" | "approved" | "rejected";

const SUBMISSION_STATUS: Record<
  SubmissionStatus,
  { label: string; dotColor: string; textColor: string; bgColor: string }
> = {
  pending:  { label: "Pendiente", dotColor: "#F0872F", textColor: "#E5730A", bgColor: "#FFF3E6" },
  approved: { label: "Aprobado",  dotColor: "#4CCB86", textColor: "#26B765", bgColor: "#E6F7EF" },
  rejected: { label: "Rechazado", dotColor: "#D94A42", textColor: "#B3261E", bgColor: "#FDECEC" },
};

function statusConfig(status: string) {
  return SUBMISSION_STATUS[status as SubmissionStatus] ?? {
    label: status,
    dotColor: "#8A8791",
    textColor: "#8A8791",
    bgColor: "#F5F3F7",
  };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;

  return StyleSheet.create({
    // ── Screen ──────────────────────────────────────────────────────────────
    scrollContent: {
      flexGrow: 1,
      backgroundColor: colors.background,
      padding: spacing[4],             // 16
      paddingBottom: spacing[8],       // 40
    },
    centered: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[6],             // 24
    },
    errorText: {
      fontSize: fontSize.sm,           // 14
      color: colors.error,
      textAlign: "center",
    },

    // ── Hero ────────────────────────────────────────────────────────────────
    hero: {
      alignItems: "center",
      paddingVertical: spacing[5],     // 20
      marginBottom: spacing[2],        // 8
    },
    title: {
      fontSize: fontSize.xl,           // 22
      fontWeight: fontWeight.bold,     // "700"
      color: colors.textStrong,
      textAlign: "center",
      marginBottom: spacing[2],        // 8
    },
    description: {
      fontSize: fontSize.sm,           // 14
      color: colors.muted,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: spacing[4],        // 16
    },
    pillsRow: {
      flexDirection: "row",
      gap: spacing[2],                 // 8
      flexWrap: "wrap",
      justifyContent: "center",
    },
    pointsPill: {
      backgroundColor: colors.rewardSoft,
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],   // 12
      paddingVertical: spacing[1],     // 4
    },
    pointsPillText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.reward,
    },
    proofPill: {
      backgroundColor: colors.infoSoft,
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],   // 12
      paddingVertical: spacing[1],     // 4
    },
    proofPillText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.medium,   // "500"
      color: colors.info,
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

    // ── Status badge ─────────────────────────────────────────────────────────
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],                 // 4
      alignSelf: "flex-start",
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],   // 8
      paddingVertical: 3,
      marginBottom: spacing[2],        // 8
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: radius.full,
    },
    statusBadgeText: {
      fontSize: fontSize.xs,           // 12
      fontWeight: fontWeight.semibold, // "600"
    },

    // ── Meta rows ────────────────────────────────────────────────────────────
    metaRow: {
      flexDirection: "row",
      gap: spacing[2],                 // 8
      marginBottom: spacing[1],        // 4
    },
    metaLabel: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.muted,
      width: 48,
    },
    metaValue: {
      flex: 1,
      fontSize: fontSize.xs,           // 12
      color: colors.text,
    },
    emptyMeta: {
      fontSize: fontSize.xs,           // 12
      color: colors.muted,
    },

    // ── Section label ────────────────────────────────────────────────────────
    sectionLabel: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: spacing[3],        // 12
      marginTop: spacing[2],           // 8
    },

    // ── Review card ──────────────────────────────────────────────────────────
    reviewCard: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,         // 16
      padding: spacing[4],             // 16
      marginBottom: spacing[3],        // 12
    },

    // ── Action buttons ───────────────────────────────────────────────────────
    actionsRow: {
      flexDirection: "row",
      gap: spacing[2],                 // 8
      marginTop: spacing[3],           // 12
    },
    btnApprove: {
      flex: 1,
      backgroundColor: colors.success,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },
    btnApproveText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },
    btnReject: {
      flex: 1,
      backgroundColor: colors.errorSoft,
      borderWidth: 0.5,
      borderColor: colors.error,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },
    btnRejectText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.error,
    },
    btnDisabled: {
      opacity: 0.4,
    },

    // ── Submit CTA ───────────────────────────────────────────────────────────
    ctaBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[4],     // 16
      alignItems: "center",
      marginTop: spacing[2],           // 8
    },
    ctaBtnText: {
      fontSize: fontSize.base,         // 16
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },
    pendingInfo: {
      marginTop: spacing[3],           // 12
      fontSize: fontSize.xs,           // 12
      color: colors.muted,
      textAlign: "center",
    },
  });
}

// ---------------------------------------------------------------------------
// TaskDetailScreen
// ---------------------------------------------------------------------------

export function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const theme = useTheme();
  const s = makeStyles(theme);

  const [task, setTask] = useState<Task | null>(null);
  const [mySubmissions, setMySubmissions] = useState<TaskSubmission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<TaskSubmission[]>([]);
  const [isReviewer, setIsReviewer] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<null | {
    title: string; message: string; confirmText: string;
    destructive?: boolean; onConfirm: () => void;
  }>(null);

  const loadTaskData = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const taskData = await getTask(taskId);
      const [mine, all, role] = await Promise.all([
        listMyTaskSubmissions(taskId),
        listTaskSubmissions(taskId),
        getMyRoleInGroup(taskData.groupId),
      ]);
      setTask(taskData);
      setMySubmissions(mine);
      setAllSubmissions(all);
      setIsReviewer(role === "owner" || role === "sub_owner");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la tarea.");
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  const handleReview = useCallback(
    (submissionId: string, status: "approved" | "rejected") => {
      const label = status === "approved" ? "aprobar" : "rechazar";
      setDialog({
        title: "Confirmar",
        message: `¿Seguro que quieres ${label} esta entrega?`,
        confirmText: status === "approved" ? "Aprobar" : "Rechazar",
        destructive: status === "rejected",
        onConfirm: async () => {
          setDialog(null);
          try {
            setError("");
            setReviewingId(submissionId);
            await reviewTaskSubmission(submissionId, status);
            await loadTaskData();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Error al revisar el envío."
            );
          } finally {
            setReviewingId(null);
          }
        },
      });
    },
    [loadTaskData]
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadTaskData);
    return unsubscribe;
  }, [navigation, loadTaskData]);

  // ── Guards ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !task) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>{error || "Tarea no encontrada."}</Text>
      </View>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const latestSubmission = mySubmissions[0] ?? null;
  const hasPending = latestSubmission?.status === "pending";
  const pendingAll = allSubmissions.filter((s) => s.status === "pending");
  const reviewedAll = allSubmissions.filter((s) => s.status !== "pending");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView contentContainerStyle={s.scrollContent}>
      <ConfirmDialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmText={dialog?.confirmText ?? ""}
        destructive={dialog?.destructive}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />

      {/* ── Hero ── */}
      <View style={s.hero}>
        <Text style={s.title}>{task.title}</Text>
        {task.description ? (
          <Text style={s.description}>{task.description}</Text>
        ) : null}
        <View style={s.pillsRow}>
          <View style={s.pointsPill}>
            <Text style={s.pointsPillText}>{task.pointsValue} pts</Text>
          </View>
          {task.requiresProof ? (
            <View style={s.proofPill}>
              <Text style={s.proofPillText}>Requiere prueba</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Mi último envío ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Mi último envío</Text>
        {latestSubmission ? (() => {
          const cfg = statusConfig(latestSubmission.status);
          return (
            <>
              <View style={[s.statusBadge, { backgroundColor: cfg.bgColor }]}>
                <View style={[s.statusDot, { backgroundColor: cfg.dotColor }]} />
                <Text style={[s.statusBadgeText, { color: cfg.textColor }]}>
                  {cfg.label}
                </Text>
              </View>
              {latestSubmission.note ? (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Nota</Text>
                  <Text style={s.metaValue}>{latestSubmission.note}</Text>
                </View>
              ) : null}
            </>
          );
        })() : (
          <Text style={s.emptyMeta}>Aún no enviaste esta tarea.</Text>
        )}
      </View>

      {/* ── Sección reviewer o CTA usuario ── */}
      {isReviewer ? (
        <>
          {/* Pendientes */}
          <Text style={s.sectionLabel}>Pendientes por revisar</Text>
          {pendingAll.length === 0 ? (
            <Text style={s.emptyMeta}>No hay envíos pendientes.</Text>
          ) : null}
          {pendingAll.map((sub) => {
            const isBusy = reviewingId === sub.id;
            return (
              <View key={sub.id} style={s.reviewCard}>
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Usuario</Text>
                  <Text style={s.metaValue}>{sub.userId}</Text>
                </View>
                {sub.note ? (
                  <View style={s.metaRow}>
                    <Text style={s.metaLabel}>Nota</Text>
                    <Text style={s.metaValue}>{sub.note}</Text>
                  </View>
                ) : null}
                {sub.proofImageUrl ? (
                  <View style={s.metaRow}>
                    <Text style={s.metaLabel}>Prueba</Text>
                    <Text style={s.metaValue} numberOfLines={1}>
                      {sub.proofImageUrl}
                    </Text>
                  </View>
                ) : null}
                <View style={s.actionsRow}>
                  <Pressable
                    style={({ pressed }) => [
                      s.btnApprove,
                      isBusy && s.btnDisabled,
                      pressed && !isBusy && { opacity: 0.8 },
                    ]}
                    onPress={() => handleReview(sub.id, "approved")}
                    disabled={isBusy}
                  >
                    <Text style={s.btnApproveText}>
                      {isBusy ? "..." : "Aprobar"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      s.btnReject,
                      isBusy && s.btnDisabled,
                      pressed && !isBusy && { opacity: 0.8 },
                    ]}
                    onPress={() => handleReview(sub.id, "rejected")}
                    disabled={isBusy}
                  >
                    <Text style={s.btnRejectText}>
                      {isBusy ? "..." : "Rechazar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {/* Historial */}
          <Text style={s.sectionLabel}>Historial de revisiones</Text>
          {reviewedAll.length === 0 ? (
            <Text style={s.emptyMeta}>Aún no hay envíos revisados.</Text>
          ) : null}
          {reviewedAll.map((sub) => {
            const cfg = statusConfig(sub.status);
            return (
              <View key={sub.id} style={s.reviewCard}>
                <View style={[s.statusBadge, { backgroundColor: cfg.bgColor }]}>
                  <View style={[s.statusDot, { backgroundColor: cfg.dotColor }]} />
                  <Text style={[s.statusBadgeText, { color: cfg.textColor }]}>
                    {cfg.label}
                  </Text>
                </View>
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Usuario</Text>
                  <Text style={s.metaValue}>{sub.userId}</Text>
                </View>
                {sub.note ? (
                  <View style={s.metaRow}>
                    <Text style={s.metaLabel}>Nota</Text>
                    <Text style={s.metaValue}>{sub.note}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </>
      ) : !hasPending ? (
        <Pressable
          style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate("SubmitTask", { taskId })}
        >
          <Text style={s.ctaBtnText}>Marcar como completada</Text>
        </Pressable>
      ) : (
        <Text style={s.pendingInfo}>
          Ya tienes un envío pendiente de revisión.
        </Text>
      )}

    </ScrollView>
  );
}