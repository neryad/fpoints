import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TasksStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
import {
  getMyRoleInGroup,
  listGroupTasks,
  listTaskSubmissions,
  registerApprovedSubmissionPoints,
  reviewTaskSubmission,
} from "../services/tasks.service";
import type { Task, TaskSubmission } from "../types";

type Props = NativeStackScreenProps<TasksStackParamList, "Approvals">;

type PendingApprovalItem = {
  submission: TaskSubmission;
  task: Task;
};

export function ApprovalsScreen({ navigation }: Props) {
  const { activeGroupId } = useAppSession();
  const [isReviewer, setIsReviewer] = useState(false);
  const [pending, setPending] = useState<PendingApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    if (!activeGroupId) {
      setPending([]);
      setIsLoading(false);
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const role = await getMyRoleInGroup(activeGroupId);
      const canReview = role === "owner" || role === "sub_owner";
      setIsReviewer(canReview);

      if (!canReview) {
        setPending([]);
        return;
      }

      const tasks = await listGroupTasks(activeGroupId);
      const submissionsByTask = await Promise.all(
        tasks.map(async (task) => {
          const submissions = await listTaskSubmissions(task.id);
          return submissions
            .filter((submission) => submission.status === "pending")
            .map((submission) => ({ submission, task }));
        }),
      );

      const flat = submissionsByTask.flat().sort((a, b) => {
        if (a.submission.createdAt > b.submission.createdAt) return -1;
        if (a.submission.createdAt < b.submission.createdAt) return 1;
        return 0;
      });

      setPending(flat);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar aprobaciones pendientes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  async function handleReview(
    item: PendingApprovalItem,
    status: "approved" | "rejected",
  ) {
    try {
      setError("");
      setReviewingId(item.submission.id);

      await reviewTaskSubmission(item.submission.id, status);
      if (status === "approved") {
        await registerApprovedSubmissionPoints(item.submission, item.task);
      }

      await loadPending();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar la revision.",
      );
    } finally {
      setReviewingId(null);
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadPending);
    return unsubscribe;
  }, [navigation, loadPending]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isReviewer) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>
          Solo owner/sub_owner puede revisar envios.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {pending.length === 0 ? (
        <Text style={styles.infoText}>No hay aprobaciones pendientes.</Text>
      ) : null}

      <FlatList
        data={pending}
        keyExtractor={(item) => item.submission.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.taskTitle}>{item.task.title}</Text>
            <Text style={styles.metaText}>
              Usuario: {item.submission.userId}
            </Text>
            <Text style={styles.metaText}>Puntos: {item.task.pointsValue}</Text>
            {item.submission.note ? (
              <Text style={styles.metaText}>Nota: {item.submission.note}</Text>
            ) : null}
            {item.submission.proofImageUrl ? (
              <Text style={styles.metaText}>
                Prueba: {item.submission.proofImageUrl}
              </Text>
            ) : null}

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleReview(item, "approved")}
                disabled={reviewingId === item.submission.id}
              >
                <Text style={styles.actionText}>Aprobar</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReview(item, "rejected")}
                disabled={reviewingId === item.submission.id}
              >
                <Text style={styles.actionText}>Rechazar</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
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
  actionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  infoText: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 24,
  },
  errorText: {
    textAlign: "center",
    color: "#B42318",
    marginBottom: 12,
  },
});
