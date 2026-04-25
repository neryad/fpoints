import { useCallback, useEffect, useState } from "react";
import { listGroupTasks } from "../services/tasks.service";
import type { Task } from "../types";

export function useTasks(groupId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!groupId) {
      setTasks([]);
      setError("");
      setIsLoading(false);
      return;
    }
    try {
      setError("");
      setIsLoading(true);
      const data = await listGroupTasks(groupId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar tareas.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { tasks, isLoading, error, reload };
}
