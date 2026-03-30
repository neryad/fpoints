import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../core/theme/colors";
import { TasksStackParamList } from "../../../app/navigation/types";
import {
  getMyRoleInGroup,
  getTask,
  listMyTaskSubmissions,
  listTaskSubmissions,
  reviewTaskSubmission,
} from "../services/tasks.service";
import type { Task, TaskSubmission } from "../types";

type Props = NativeStackScreenProps<TasksStackParamList, "TaskDetail">;

export function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [mySubmissions, setMySubmissions] = useState<TaskSubmission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<TaskSubmission[]>([]);
  const [isReviewer, setIsReviewer] = useState(false);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTaskData() {
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
      setError(
        err instanceof Error ? err.message : "Error al cargar la tarea.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleReview(submissionId: string, status: "approved" | "rejected") {
    const label = status === "approved" ? "aprobar" : "rechazar";
    Alert.alert(
      "Confirmar",
      `\u00bfSeguro que quieres ${label} esta entrega?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: status === "approved" ? "Aprobar" : "Rechazar",
          style: status === "rejected" ? "destructive" : "default",
          onPress: async () => {
            try {
              setError("");
              setReviewingSubmissionId(submissionId);
              await reviewTaskSubmission(submissionId, status);
              await loadTaskData();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Error al revisar envio.",
              );
            } finally {
              setReviewingSubmissionId(null);
            }
          },
        },
      ],
    );
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadTaskData);

    return unsubscribe;
  }, [navigation, taskId]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!task) return null;

  const latestMySubmission = mySubmissions[0] ?? null;
  const hasPendingMySubmission = latestMySubmission?.status === "pending";
  const pendingSubmissions = allSubmissions.filter(
    (submission) => submission.status === "pending",
  );
  const reviewedSubmissions = allSubmissions.filter(
    (submission) => submission.status !== "pending",
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{task.title}</Text>
      {task.description ? (
        <Text style={styles.description}>{task.description}</Text>
      ) : null}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{task.pointsValue} puntos</Text>
      </View>
      {task.requiresProof ? (
        <Text style={styles.meta}>Requiere prueba fotográfica</Text>
      ) : null}

      {latestMySubmission ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Tu ultimo envio</Text>
          <Text style={styles.statusText}>
            Estado: {latestMySubmission.status}
          </Text>
          {latestMySubmission.note ? (
            <Text style={styles.statusText}>
              Nota: {latestMySubmission.note}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.meta}>Aun no enviaste esta tarea.</Text>
      )}

      {isReviewer ? (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Pendientes por revisar</Text>
          {pendingSubmissions.length === 0 ? (
            <Text style={styles.meta}>No hay envios pendientes.</Text>
          ) : null}
          {pendingSubmissions.map((submission) => (
            <View key={submission.id} style={styles.reviewCard}>
              <Text style={styles.statusText}>
                Usuario: {submission.userId}
              </Text>
              {submission.note ? (
                <Text style={styles.statusText}>Nota: {submission.note}</Text>
              ) : null}
              {submission.proofImageUrl ? (
                <Text style={styles.statusText}>
                  Prueba: {submission.proofImageUrl}
                </Text>
              ) : null}
              <View style={styles.reviewActions}>
                <Pressable
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleReview(submission.id, "approved")}
                  disabled={reviewingSubmissionId === submission.id}
                >
                  <Text style={styles.actionButtonText}>Aprobar</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReview(submission.id, "rejected")}
                  disabled={reviewingSubmissionId === submission.id}
                >
                  <Text style={styles.actionButtonText}>Rechazar</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Text style={styles.reviewTitle}>Historial de revisiones</Text>
          {reviewedSubmissions.length === 0 ? (
            <Text style={styles.meta}>
              Aun no hay envios aprobados o rechazados.
            </Text>
          ) : null}
          {reviewedSubmissions.map((submission) => (
            <View key={submission.id} style={styles.reviewCard}>
              <Text style={styles.statusText}>
                Usuario: {submission.userId}
              </Text>
              <Text style={styles.statusText}>Estado: {submission.status}</Text>
              {submission.note ? (
                <Text style={styles.statusText}>Nota: {submission.note}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : !hasPendingMySubmission ? (
        <View style={styles.submitButtonWrap}>
          <Button
            title="Marcar como completada"
            onPress={() => navigation.navigate("SubmitTask", { taskId })}
          />
        </View>
      ) : (
        <Text style={styles.pendingInfo}>
          Ya tienes un envio pendiente de revision.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
  },
  badge: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: colors.primaryText,
    fontWeight: "700",
    fontSize: 16,
  },
  meta: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
  },
  statusCard: {
    marginTop: 20,
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  statusText: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 4,
  },
  submitButtonWrap: {
    marginTop: 16,
    width: "100%",
  },
  pendingInfo: {
    marginTop: 14,
    color: colors.muted,
    textAlign: "center",
  },
  reviewSection: {
    marginTop: 20,
    width: "100%",
  },
  reviewTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  reviewActions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#0B6E4F",
  },
  rejectButton: {
    backgroundColor: "#B42318",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
  },
});
