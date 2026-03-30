import { supabase } from "../../../core/supabase/client";

type PointTransactionRow = {
  user_id: string;
  amount: number;
  created_at?: string;
};

type UserProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
};

type LeaderboardRpcRow = {
  user_id: string;
  points: number;
  display_name: string | null;
};

export type GroupPointsEntry = {
  userId: string;
  displayName: string;
  points: number;
};

export type PointHistoryEntry = {
  id: string;
  amount: number;
  reason: string;
  taskTitle: string | null;
  rewardTitle: string | null;
  createdAt: string;
};

export type PointHistoryPage = {
  items: PointHistoryEntry[];
  hasMore: boolean;
  nextOffset: number;
};

const DEFAULT_POINT_HISTORY_LIMIT = 120;
const MAX_POINT_HISTORY_LIMIT = 300;

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase no esta configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

async function getCurrentUserId() {
  const client = ensureSupabase();
  const { data, error } = await client.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error("No hay usuario autenticado.");

  return data.user.id;
}

function aggregatePoints(rows: PointTransactionRow[]): GroupPointsEntry[] {
  const totalsByUser = new Map<string, number>();

  for (const row of rows) {
    const current = totalsByUser.get(row.user_id) ?? 0;
    totalsByUser.set(row.user_id, current + row.amount);
  }

  return Array.from(totalsByUser.entries())
    .map(([userId, points]) => ({
      userId,
      displayName: "Usuario sin perfil",
      points,
    }))
    .sort((a, b) => b.points - a.points);
}

function mergeDisplayNames(
  leaderboard: GroupPointsEntry[],
  users: UserProfileRow[],
): GroupPointsEntry[] {
  const usersById = new Map(
    users.map((user) => [
      user.id,
      user.name || user.email || "Usuario sin perfil",
    ]),
  );

  return leaderboard.map((entry) => ({
    ...entry,
    displayName: usersById.get(entry.userId) ?? entry.displayName,
  }));
}

function getWeekStartIso() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  now.setDate(now.getDate() - diffToMonday);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function mapLeaderboardRpcRows(rows: LeaderboardRpcRow[]): GroupPointsEntry[] {
  return rows.map((row) => ({
    userId: row.user_id,
    points: Number(row.points) || 0,
    displayName: row.display_name || "Usuario sin perfil",
  }));
}

async function tryGetLeaderboardFromRpc(
  groupId: string,
  sinceIso?: string,
): Promise<GroupPointsEntry[] | null> {
  const client = ensureSupabase();

  const { data, error } = await client.rpc("get_group_points_leaderboard", {
    input_group_id: groupId,
    input_since: sinceIso ?? null,
  });

  if (error || !data) {
    return null;
  }

  return mapLeaderboardRpcRows(data as LeaderboardRpcRow[]);
}

export async function getMyPointsBalance(groupId: string): Promise<number> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from("point_transactions")
    .select("amount")
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(
      "No se pudieron cargar tus puntos. Verifica tabla/politicas de point_transactions.",
    );
  }

  return (data ?? []).reduce((sum, row) => sum + (row.amount as number), 0);
}

export async function getCurrentUserIdForPoints(): Promise<string> {
  return getCurrentUserId();
}

export async function getMyWeeklyPointsBalance(
  groupId: string,
): Promise<number> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();
  const weekStartIso = getWeekStartIso();

  const { data, error } = await client
    .from("point_transactions")
    .select("amount")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .gte("created_at", weekStartIso);

  if (error) {
    throw new Error(
      "No se pudieron cargar tus puntos semanales. Verifica tabla/politicas de point_transactions.",
    );
  }

  return (data ?? []).reduce((sum, row) => sum + (row.amount as number), 0);
}

export async function getMyWeeklyPointsEarned(
  groupId: string,
): Promise<number> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();
  const weekStartIso = getWeekStartIso();

  const { data, error } = await client
    .from("point_transactions")
    .select("amount")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .gte("created_at", weekStartIso);

  if (error) {
    throw new Error(
      "No se pudieron cargar tus puntos ganados esta semana. Verifica tabla/politicas de point_transactions.",
    );
  }

  return (data ?? [])
    .filter((row) => (row.amount as number) > 0)
    .reduce((sum, row) => sum + (row.amount as number), 0);
}

export async function listMyPointHistory(
  groupId: string,
  limit = DEFAULT_POINT_HISTORY_LIMIT,
): Promise<PointHistoryEntry[]> {
  const page = await listMyPointHistoryPage(groupId, { limit, offset: 0 });
  return page.items;
}

export async function listMyPointHistoryPage(
  groupId: string,
  options?: { limit?: number; offset?: number },
): Promise<PointHistoryPage> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();
  const requestedLimit = options?.limit ?? DEFAULT_POINT_HISTORY_LIMIT;
  const safeLimit = Math.max(
    1,
    Math.min(MAX_POINT_HISTORY_LIMIT, Math.floor(requestedLimit)),
  );
  const safeOffset = Math.max(0, Math.floor(options?.offset ?? 0));

  const { data, error } = await client
    .from("point_transactions")
    .select("id, amount, reason, created_at")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(safeOffset, safeOffset + safeLimit);

  if (error) {
    throw new Error(
      "No se pudo cargar el historial de puntos. Verifica tabla/politicas de point_transactions.",
    );
  }

  const rows = data ?? [];
  const hasMore = rows.length > safeLimit;
  const visibleRows = hasMore ? rows.slice(0, safeLimit) : rows;

  // Extract submission IDs from reasons like "task_approved:{uuid}"
  const submissionIds = Array.from(
    new Set(
      visibleRows
        .map((row) => {
          const reason = row.reason as string;
          if (reason?.startsWith("task_approved:")) {
            return reason.slice("task_approved:".length);
          }
          return null;
        })
        .filter((id): id is string => id !== null),
    ),
  );

  // Extract redemption IDs from reasons like "reward_redeemed:{uuid}"
  const redemptionIds = Array.from(
    new Set(
      visibleRows
        .map((row) => {
          const reason = row.reason as string;
          if (reason?.startsWith("reward_redeemed:")) {
            return reason.slice("reward_redeemed:".length);
          }
          return null;
        })
        .filter((id): id is string => id !== null),
    ),
  );

  // Batch-resolve task titles for those submissions
  const titlesBySubmissionId = new Map<string, string>();
  if (submissionIds.length > 0) {
    const { data: subData } = await client
      .from("task_submissions")
      .select("id, tasks(title)")
      .in("id", submissionIds);

    for (const sub of subData ?? []) {
      const submissionId = sub.id as string;
      const taskRaw = sub.tasks;
      const title = Array.isArray(taskRaw)
        ? (taskRaw[0] as { title: string } | undefined)?.title
        : (taskRaw as { title: string } | null)?.title;
      if (title) {
        titlesBySubmissionId.set(submissionId, title);
      }
    }
  }

  // Resolve reward titles for redemption movements.
  const titlesByRedemptionId = new Map<string, string>();
  if (redemptionIds.length > 0) {
    const { data: redemptionData } = await client
      .from("reward_redemptions")
      .select("id, reward_title")
      .in("id", redemptionIds);

    for (const redemption of redemptionData ?? []) {
      const redemptionId = redemption.id as string;
      const rewardTitle = (redemption.reward_title as string | null) ?? null;
      if (rewardTitle) {
        titlesByRedemptionId.set(redemptionId, rewardTitle);
      }
    }
  }

  const items = visibleRows.map((row) => {
    const reason = row.reason as string;
    let taskTitle: string | null = null;
    let rewardTitle: string | null = null;
    if (reason?.startsWith("task_approved:")) {
      const submissionId = reason.slice("task_approved:".length);
      taskTitle = titlesBySubmissionId.get(submissionId) ?? null;
    }
    if (reason?.startsWith("reward_redeemed:")) {
      const redemptionId = reason.slice("reward_redeemed:".length);
      rewardTitle = titlesByRedemptionId.get(redemptionId) ?? null;
    }
    return {
      id: row.id as string,
      amount: row.amount as number,
      reason,
      taskTitle,
      rewardTitle,
      createdAt: row.created_at as string,
    };
  });

  return {
    items,
    hasMore,
    nextOffset: safeOffset + items.length,
  };
}

export async function getWeeklyGroupPointsLeaderboard(
  groupId: string,
): Promise<GroupPointsEntry[]> {
  const weekStartIso = getWeekStartIso();

  const rpcLeaderboard = await tryGetLeaderboardFromRpc(groupId, weekStartIso);
  if (rpcLeaderboard) {
    return rpcLeaderboard;
  }

  const client = ensureSupabase();

  const { data, error } = await client
    .from("point_transactions")
    .select("user_id, amount")
    .eq("group_id", groupId)
    .gte("created_at", weekStartIso);

  if (error) {
    throw new Error(
      "No se pudo cargar el ranking semanal. Verifica tabla/politicas de point_transactions.",
    );
  }

  const leaderboard = aggregatePoints((data ?? []) as PointTransactionRow[]);
  if (leaderboard.length === 0) return leaderboard;

  const { data: rpcData, error: rpcError } = await client.rpc(
    "get_group_user_labels",
    {
      input_group_id: groupId,
    },
  );

  if (!rpcError && rpcData) {
    const labelsById = new Map<string, string>();
    for (const row of rpcData as Array<Record<string, unknown>>) {
      const id = (row.user_id as string) ?? "";
      const displayName = (row.display_name as string) ?? "";
      if (id) {
        labelsById.set(id, displayName || "Usuario sin perfil");
      }
    }

    return leaderboard.map((entry) => ({
      ...entry,
      displayName: labelsById.get(entry.userId) ?? entry.displayName,
    }));
  }

  return leaderboard;
}

export async function getGroupPointsLeaderboard(
  groupId: string,
): Promise<GroupPointsEntry[]> {
  const rpcLeaderboard = await tryGetLeaderboardFromRpc(groupId);
  if (rpcLeaderboard) {
    return rpcLeaderboard;
  }

  const client = ensureSupabase();

  const { data, error } = await client
    .from("point_transactions")
    .select("user_id, amount")
    .eq("group_id", groupId);

  if (error) {
    throw new Error(
      "No se pudo cargar el ranking. Verifica tabla/politicas de point_transactions.",
    );
  }

  const leaderboard = aggregatePoints((data ?? []) as PointTransactionRow[]);
  if (leaderboard.length === 0) return leaderboard;

  const userIds = leaderboard.map((entry) => entry.userId);

  // Prefer a group-scoped RPC to avoid fragile direct users-table RLS reads.
  const { data: rpcData, error: rpcError } = await client.rpc(
    "get_group_user_labels",
    {
      input_group_id: groupId,
    },
  );

  if (!rpcError && rpcData) {
    const labelsById = new Map<string, string>();
    for (const row of rpcData as Array<Record<string, unknown>>) {
      const id = (row.user_id as string) ?? "";
      const displayName = (row.display_name as string) ?? "";
      if (id) {
        labelsById.set(id, displayName || "Usuario sin perfil");
      }
    }

    return leaderboard.map((entry) => ({
      ...entry,
      displayName: labelsById.get(entry.userId) ?? entry.displayName,
    }));
  }

  // Best effort: if users table/RLS is not ready, keep ID fallback labels.
  const { data: usersData, error: usersError } = await client
    .from("users")
    .select("id, name, email")
    .in("id", userIds);

  if (usersError || !usersData) {
    return leaderboard;
  }

  return mergeDisplayNames(leaderboard, usersData as UserProfileRow[]);
}
