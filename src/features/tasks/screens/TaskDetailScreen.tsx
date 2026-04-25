import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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

function getStatusClasses(status: string) {
  const map: Record<string, { label: string; bg: string; dot: string; text: string }> = {
    pending:  { label: "Pendiente", bg: "bg-warning/15",     dot: "bg-warning",     text: "text-warning" },
    approved: { label: "Aprobado",  bg: "bg-success/15",     dot: "bg-success",     text: "text-success" },
    rejected: { label: "Rechazado", bg: "bg-destructive/15", dot: "bg-destructive", text: "text-destructive" },
  };
  return map[status] ?? { label: status, bg: "bg-muted", dot: "bg-muted-foreground", text: "text-muted-foreground" };
}

export function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const { colors } = useTheme();

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
            setError(err instanceof Error ? err.message : "Error al revisar el envío.");
          } finally {
            setReviewingId(null);
          }
        },
      });
    },
    [loadTaskData]
  );

  const loadTaskDataRef = useRef(loadTaskData);
  useEffect(() => { loadTaskDataRef.current = loadTaskData; }, [loadTaskData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => loadTaskDataRef.current());
    return unsubscribe;
  }, [navigation]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !task) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-sm text-destructive text-center">{error || "Tarea no encontrada."}</Text>
      </View>
    );
  }

  const latestSubmission = mySubmissions[0] ?? null;
  const hasPending = latestSubmission?.status === "pending";
  const pendingAll = allSubmissions.filter((s) => s.status === "pending");
  const reviewedAll = allSubmissions.filter((s) => s.status !== "pending");

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <ConfirmDialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmText={dialog?.confirmText ?? ""}
        destructive={dialog?.destructive}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />

      {/* Hero */}
      <View className="items-center py-5 mb-2">
        <Text className="text-[22px] font-sans-bold text-foreground text-center mb-2">
          {task.title}
        </Text>
        {task.description ? (
          <Text className="text-sm font-sans text-muted-foreground text-center leading-5 mb-4">
            {task.description}
          </Text>
        ) : null}
        <View className="flex-row gap-2 flex-wrap justify-center">
          <View className="bg-points/15 rounded-full px-3 py-1">
            <Text className="text-sm font-sans-bold text-points">{task.pointsValue} pts</Text>
          </View>
          {task.requiresProof ? (
            <View className="bg-secondary rounded-full px-3 py-1">
              <Text className="text-sm font-sans-medium text-secondary-foreground">Requiere prueba</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Mi último envío */}
      <View className="bg-card border border-border rounded-xl p-4 mb-3">
        <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-3">
          Mi último envío
        </Text>
        {latestSubmission ? (() => {
          const cfg = getStatusClasses(latestSubmission.status);
          return (
            <>
              <View className={`flex-row items-center gap-1 self-start rounded-full px-2 mb-2 ${cfg.bg}`} style={{ paddingVertical: 3 }}>
                <View className={`w-[7px] h-[7px] rounded-full ${cfg.dot}`} />
                <Text className={`text-xs font-sans-semibold ${cfg.text}`}>{cfg.label}</Text>
              </View>
              {latestSubmission.note ? (
                <View className="flex-row gap-2 mb-1">
                  <Text className="text-[11px] font-sans-medium text-muted-foreground w-12">Nota</Text>
                  <Text className="flex-1 text-xs text-foreground">{latestSubmission.note}</Text>
                </View>
              ) : null}
            </>
          );
        })() : (
          <Text className="text-xs text-muted-foreground">Aún no enviaste esta tarea.</Text>
        )}
      </View>

      {/* Sección reviewer o CTA usuario */}
      {isReviewer ? (
        <>
          <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-3 mt-2">
            Pendientes por revisar
          </Text>
          {pendingAll.length === 0 ? (
            <Text className="text-xs text-muted-foreground mb-3">No hay envíos pendientes.</Text>
          ) : null}
          {pendingAll.map((sub) => {
            const isBusy = reviewingId === sub.id;
            return (
              <View key={sub.id} className="bg-card border border-border rounded-xl p-4 mb-3">
                <View className="flex-row gap-2 mb-1">
                  <Text className="text-[11px] font-sans-medium text-muted-foreground w-12">Usuario</Text>
                  <Text className="flex-1 text-xs text-foreground">{sub.userId}</Text>
                </View>
                {sub.note ? (
                  <View className="flex-row gap-2 mb-1">
                    <Text className="text-[11px] font-sans-medium text-muted-foreground w-12">Nota</Text>
                    <Text className="flex-1 text-xs text-foreground">{sub.note}</Text>
                  </View>
                ) : null}
                {sub.proofImageUrl ? (
                  <View className="flex-row gap-2 mb-1">
                    <Text className="text-[11px] font-sans-medium text-muted-foreground w-12">Prueba</Text>
                    <Text className="flex-1 text-xs text-foreground" numberOfLines={1}>{sub.proofImageUrl}</Text>
                  </View>
                ) : null}
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    className={`flex-1 bg-success rounded-xl py-3 items-center active:opacity-80 ${isBusy ? "opacity-40" : ""}`}
                    onPress={() => handleReview(sub.id, "approved")}
                    disabled={isBusy}
                  >
                    <Text className="text-sm font-sans-bold text-primary-foreground">
                      {isBusy ? "..." : "Aprobar"}
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 bg-destructive/15 border border-destructive rounded-xl py-3 items-center active:opacity-80 ${isBusy ? "opacity-40" : ""}`}
                    onPress={() => handleReview(sub.id, "rejected")}
                    disabled={isBusy}
                  >
                    <Text className="text-sm font-sans-bold text-destructive">
                      {isBusy ? "..." : "Rechazar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-3 mt-2">
            Historial de revisiones
          </Text>
          {reviewedAll.length === 0 ? (
            <Text className="text-xs text-muted-foreground">Aún no hay envíos revisados.</Text>
          ) : null}
          {reviewedAll.map((sub) => {
            const cfg = getStatusClasses(sub.status);
            return (
              <View key={sub.id} className="bg-card border border-border rounded-xl p-4 mb-3">
                <View className={`flex-row items-center gap-1 self-start rounded-full px-2 mb-2 ${cfg.bg}`} style={{ paddingVertical: 3 }}>
                  <View className={`w-[7px] h-[7px] rounded-full ${cfg.dot}`} />
                  <Text className={`text-xs font-sans-semibold ${cfg.text}`}>{cfg.label}</Text>
                </View>
                <View className="flex-row gap-2 mb-1">
                  <Text className="text-[11px] font-sans-medium text-muted-foreground w-12">Usuario</Text>
                  <Text className="flex-1 text-xs text-foreground">{sub.userId}</Text>
                </View>
                {sub.note ? (
                  <View className="flex-row gap-2 mb-1">
                    <Text className="text-[11px] font-sans-medium text-muted-foreground w-12">Nota</Text>
                    <Text className="flex-1 text-xs text-foreground">{sub.note}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </>
      ) : !hasPending ? (
        <Pressable
          className="bg-primary rounded-xl py-4 items-center mt-2 active:opacity-80"
          onPress={() => navigation.navigate("SubmitTask", { taskId })}
        >
          <Text className="text-base font-sans-bold text-primary-foreground">Marcar como completada</Text>
        </Pressable>
      ) : (
        <Text className="mt-3 text-xs text-muted-foreground text-center font-sans">
          Ya tienes un envío pendiente de revisión.
        </Text>
      )}
    </ScrollView>
  );
}
