import { useCallback, useEffect, useState } from "react";
import { listGroupTasks, listMySubmissionsForTasks, getUserDisplayNames } from "../services/tasks.service";
import type { Task, TaskSubmissionStatus } from "../types";

export function useTasks(groupId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissionsByTaskId, setSubmissionsByTaskId] = useState<Record<string, TaskSubmissionStatus>>({});
  const [assigneeNames, setAssigneeNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!groupId) {
      setTasks([]);
      setSubmissionsByTaskId({});
      setAssigneeNames({});
      setError("");
      setIsLoading(false);
      return;
    }
    try {
      setError("");
      setIsLoading(true);
      const data = await listGroupTasks(groupId);
      setTasks(data);

      const taskIds = data.map((t) => t.id);
      const assignedIds = data.map((t) => t.assignedTo).filter((id): id is string => !!id);

      const [submissions, names] = await Promise.all([
        listMySubmissionsForTasks(taskIds),
        assignedIds.length > 0 ? getUserDisplayNames(assignedIds, groupId) : Promise.resolve({}),
      ]);

      setSubmissionsByTaskId(submissions);
      setAssigneeNames(names);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar tareas.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { tasks, submissionsByTaskId, assigneeNames, isLoading, error, reload };
}
