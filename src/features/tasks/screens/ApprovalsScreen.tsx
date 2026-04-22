import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TasksStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import {
  getMyRoleInGroup,
  getUserDisplayNames,
  listGroupTasks,
  listTaskSubmissions,
  reviewTaskSubmission,
} from "../services/tasks.service";
import type { Task, TaskSubmission } from "../types";

type Props = NativeStackScreenProps<TasksStackParamList, "Approvals">;

type PendingApprovalItem = { submission: TaskSubmission; task: Task };
type ProofFilter = "all" | "withProof" | "withoutProof";

const PROOF_FILTERS: ProofFilter[] = ["all", "withProof", "withoutProof"];
const PROOF_LABELS: Record<ProofFilter, string> = {
  all: "Todas",
  withProof: "Con prueba",
  withoutProof: "Sin prueba",
};

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing[4],
    },
    centered: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[6],
    },
    infoText: {
      textAlign: "center",
      fontSize: fontSize.sm,
      color: colors.muted,
      marginTop: spacing[6],
    },
    errorText: {
      textAlign: "center",
      fontSize: fontSize.xs,
      color: colors.error,
      marginBottom: spacing[3],
    },
    filterInput: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      marginBottom: spacing[2],
      color: colors.text,
      fontSize: fontSize.sm,
    },
    chipsRow: {
      flexDirection: "row",
      gap: spacing[2],
      marginBottom: spacing[3],
    },
    chip: {
      borderRadius: radius.full,
      borderWidth: 0.5,
      borderColor: colors.border,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      backgroundColor: colors.surface,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.muted,
    },
    chipTextActive: {
      color: colors.primaryText,
    },
    listContent: {
      paddingBottom: spacing[7],
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing[4],
      marginBottom: spacing[3],
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing[2],
      marginBottom: spacing[3],
    },
    taskTitle: {
      flex: 1,
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
      color: colors.textStrong,
    },
    pointsPill: {
      backgroundColor: colors.rewardSoft,
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: 3,
    },
    pointsPillText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: colors.reward,
    },
    metaRow: {
      flexDirection: "row",
      gap: spacing[2],
      marginBottom: spacing[1],
    },
    metaLabel: {
      fontSize: fontSize.xxs,
      fontWeight: fontWeight.medium,
      color: colors.muted,
      width: 52,
    },
    metaValue: {
      flex: 1,
      fontSize: fontSize.xs,
      color: colors.text,
    },
    proofBadge: {
      alignSelf: "flex-start",
      marginTop: spacing[2],
      backgroundColor: colors.infoSoft,
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: 2,
    },
    proofBadgeText: {
      fontSize: fontSize.xxs,
      fontWeight: fontWeight.medium,
      color: colors.info,
    },
    actionsRow: {
      flexDirection: "row",
      gap: spacing[2],
      marginTop: spacing[3],
    },
    btnApprove: {
      flex: 1,
      backgroundColor: colors.success,
      borderRadius: radius.md,
      paddingVertical: spacing[3],
      alignItems: "center",
    },
    btnApproveText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: colors.primaryText,
    },
    btnReject: {
      flex: 1,
      backgroundColor: colors.errorSoft,
      borderWidth: 0.5,
      borderColor: colors.error,
      borderRadius: radius.md,
      paddingVertical: spacing[3],
      alignItems: "center",
    },
    btnRejectText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: colors.error,
    },
    btnDisabled: { opacity: 0.4 },
  });
}

export function ApprovalsScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { activeGroupId } = useAppSession();

  const [isReviewer, setIsReviewer] = useState(false);
  const [pending, setPending] = useState<PendingApprovalItem[]>([]);
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [proofFilter, setProofFilter] = useState<ProofFilter>("all");
  const [dialog, setDialog] = useState<null | {
    title: string; message: string; confirmText: string;
    destructive?: boolean; onConfirm: () => void;
  }>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadPending = useCallback(async () => {
    if (!activeGroupId) { setPending([]); setIsLoading(false); return; }
    try {
      setError("");
      setIsLoading(true);
      const role = await getMyRoleInGroup(activeGroupId);
      const canReview = role === "owner" || role === "sub_owner";
      if (!isMountedRef.current) return;
      setIsReviewer(canReview);
      if (!canReview) { setPending([]); return; }
      const tasks = await listGroupTasks(activeGroupId);
      const byTask = await Promise.all(
        tasks.map(async (task) => {
          const subs = await listTaskSubmissions(task.id);
          return subs.filter((s) => s.status === "pending").map((submission) => ({ submission, task }));
        }),
      );
      if (!isMountedRef.current) return;
      const flat = byTask.flat().sort((a, b) =>
        a.submission.createdAt > b.submission.createdAt ? -1 : 1,
      );
      setPending(flat);
      const labels = await getUserDisplayNames(flat.map((i) => i.submission.userId), activeGroupId);
      if (isMountedRef.current) setUserDisplayNames(labels);
    } catch (err) {
      if (isMountedRef.current) setError(err instanceof Error ? err.message : "No se pudieron cargar las aprobaciones.");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [activeGroupId]);

  const handleReview = useCallback(
    (item: PendingApprovalItem, status: "approved" | "rejected") => {
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
            setReviewingId(item.submission.id);
            await reviewTaskSubmission(item.submission.id, status);
            await loadPending();
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo completar la revisión.");
          } finally {
            setReviewingId(null);
          }
        },
      });
    },
    [loadPending],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadPending);
    return unsubscribe;
  }, [navigation, loadPending]);

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isReviewer) {
    return (
      <View style={s.centered}>
        <Text style={s.infoText}>Solo owner o sub_owner puede revisar envíos.</Text>
      </View>
    );
  }

  const normTask = taskFilter.trim().toLowerCase();
  const normUser = userFilter.trim().toLowerCase();
  const filtered = pending.filter((item) => {
    const taskOk = !normTask || item.task.title.toLowerCase().includes(normTask);
    const userLabel = userDisplayNames[item.submission.userId] ?? item.submission.userId;
    const userOk = !normUser || userLabel.toLowerCase().includes(normUser) || item.submission.userId.toLowerCase().includes(normUser);
    const hasProof = Boolean(item.submission.proofImageUrl?.trim());
    const proofOk = proofFilter === "all" || (proofFilter === "withProof" && hasProof) || (proofFilter === "withoutProof" && !hasProof);
    return taskOk && userOk && proofOk;
  });

  return (
    <View style={s.container}>
      <ConfirmDialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmText={dialog?.confirmText ?? ""}
        destructive={dialog?.destructive}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />
      {error ? <Text style={s.errorText}>{error}</Text> : null}

      <TextInput
        style={s.filterInput}
        placeholder="Filtrar por tarea"
        placeholderTextColor={theme.colors.muted}
        value={taskFilter}
        onChangeText={setTaskFilter}
      />
      <TextInput
        style={s.filterInput}
        placeholder="Filtrar por usuario"
        placeholderTextColor={theme.colors.muted}
        value={userFilter}
        onChangeText={setUserFilter}
        autoCapitalize="none"
      />

      <View style={s.chipsRow}>
        {PROOF_FILTERS.map((f) => {
          const active = proofFilter === f;
          return (
            <Pressable
              key={f}
              style={({ pressed }) => [s.chip, active && s.chipActive, pressed && { opacity: 0.7 }]}
              onPress={() => setProofFilter(f)}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{PROOF_LABELS[f]}</Text>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <Text style={s.infoText}>No hay aprobaciones pendientes.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.submission.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => {
            const isBusy = reviewingId === item.submission.id;
            const displayName = userDisplayNames[item.submission.userId] ?? item.submission.userId;
            return (
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.taskTitle}>{item.task.title}</Text>
                  <View style={s.pointsPill}>
                    <Text style={s.pointsPillText}>{item.task.pointsValue} pts</Text>
                  </View>
                </View>
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Usuario</Text>
                  <Text style={s.metaValue}>{displayName}</Text>
                </View>
                {item.submission.note ? (
                  <View style={s.metaRow}>
                    <Text style={s.metaLabel}>Nota</Text>
                    <Text style={s.metaValue}>{item.submission.note}</Text>
                  </View>
                ) : null}
                {item.submission.proofImageUrl ? (
                  <View style={s.proofBadge}>
                    <Text style={s.proofBadgeText}>Incluye prueba fotográfica</Text>
                  </View>
                ) : null}
                <View style={s.actionsRow}>
                  <Pressable
                    style={({ pressed }) => [s.btnApprove, isBusy && s.btnDisabled, pressed && !isBusy && { opacity: 0.8 }]}
                    onPress={() => handleReview(item, "approved")}
                    disabled={isBusy}
                  >
                    <Text style={s.btnApproveText}>{isBusy ? "..." : "Aprobar"}</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [s.btnReject, isBusy && s.btnDisabled, pressed && !isBusy && { opacity: 0.8 }]}
                    onPress={() => handleReview(item, "rejected")}
                    disabled={isBusy}
                  >
                    <Text style={s.btnRejectText}>{isBusy ? "..." : "Rechazar"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}