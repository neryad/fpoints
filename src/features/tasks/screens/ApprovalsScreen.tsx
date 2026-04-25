import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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

export function ApprovalsScreen({ navigation }: Props) {
  const { colors } = useTheme();
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
      <View className="flex-1 bg-background items-center justify-center p-6">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isReviewer) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-sm text-muted-foreground text-center">
          Solo owner o sub_owner puede revisar envíos.
        </Text>
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
    <View className="flex-1 bg-background p-4">
      <ConfirmDialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmText={dialog?.confirmText ?? ""}
        destructive={dialog?.destructive}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />
      {error ? (
        <Text className="text-destructive text-xs text-center mb-3 font-sans">{error}</Text>
      ) : null}

      <TextInput
        className="bg-card border border-border rounded-lg px-3 py-3 mb-2 text-sm text-foreground"
        placeholder="Filtrar por tarea"
        placeholderTextColor={colors.muted}
        value={taskFilter}
        onChangeText={setTaskFilter}
      />
      <TextInput
        className="bg-card border border-border rounded-lg px-3 py-3 mb-3 text-sm text-foreground"
        placeholder="Filtrar por usuario"
        placeholderTextColor={colors.muted}
        value={userFilter}
        onChangeText={setUserFilter}
        autoCapitalize="none"
      />

      <View className="flex-row gap-2 mb-3">
        {PROOF_FILTERS.map((f) => {
          const active = proofFilter === f;
          return (
            <Pressable
              key={f}
              className={`rounded-full border px-3 py-2 active:opacity-70 ${active ? "bg-primary border-primary" : "bg-card border-border"}`}
              onPress={() => setProofFilter(f)}
            >
              <Text className={`text-xs font-sans-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>
                {PROOF_LABELS[f]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center mt-6">
          No hay aprobaciones pendientes.
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.submission.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => {
            const isBusy = reviewingId === item.submission.id;
            const displayName = userDisplayNames[item.submission.userId] ?? item.submission.userId;
            return (
              <View className="bg-card border border-border rounded-xl p-4 mb-3">
                <View className="flex-row justify-between items-start gap-2 mb-3">
                  <Text className="flex-1 text-base font-sans-semibold text-foreground">
                    {item.task.title}
                  </Text>
                  <View className="bg-points/15 rounded-full px-2" style={{ paddingVertical: 3 }}>
                    <Text className="text-xs font-sans-bold text-points">{item.task.pointsValue} pts</Text>
                  </View>
                </View>
                <View className="flex-row gap-2 mb-1">
                  <Text className="text-[11px] font-sans-medium text-muted-foreground w-[52px]">Usuario</Text>
                  <Text className="flex-1 text-xs text-foreground">{displayName}</Text>
                </View>
                {item.submission.note ? (
                  <View className="flex-row gap-2 mb-1">
                    <Text className="text-[11px] font-sans-medium text-muted-foreground w-[52px]">Nota</Text>
                    <Text className="flex-1 text-xs text-foreground">{item.submission.note}</Text>
                  </View>
                ) : null}
                {item.submission.proofImageUrl ? (
                  <View className="self-start mt-2 bg-secondary rounded-full px-2" style={{ paddingVertical: 2 }}>
                    <Text className="text-[11px] font-sans-medium text-secondary-foreground">
                      Incluye prueba fotográfica
                    </Text>
                  </View>
                ) : null}
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    className={`flex-1 bg-success rounded-xl py-3 items-center active:opacity-80 ${isBusy ? "opacity-40" : ""}`}
                    onPress={() => handleReview(item, "approved")}
                    disabled={isBusy}
                  >
                    <Text className="text-sm font-sans-bold text-primary-foreground">
                      {isBusy ? "..." : "Aprobar"}
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 bg-destructive/15 border border-destructive rounded-xl py-3 items-center active:opacity-80 ${isBusy ? "opacity-40" : ""}`}
                    onPress={() => handleReview(item, "rejected")}
                    disabled={isBusy}
                  >
                    <Text className="text-sm font-sans-bold text-destructive">
                      {isBusy ? "..." : "Rechazar"}
                    </Text>
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
