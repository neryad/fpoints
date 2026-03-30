import { useCallback, useEffect, useState } from "react";
import { listMyGroups } from "../services/groups.service";
import type { Group } from "../types";

export type GroupListItem = Group & { my_role?: string };

export function useGroups() {
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const data = await listMyGroups();
      setGroups(data as GroupListItem[]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar grupos.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { groups, isLoading, error, reload };
}
