import { supabase } from "../../../core/supabase/client";

type PointTransactionRow = {
  user_id: string;
  amount: number;
};

type UserProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
};

export type GroupPointsEntry = {
  userId: string;
  displayName: string;
  points: number;
};

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
      displayName: `${userId.slice(0, 8)}...`,
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
      user.name || user.email || `${user.id.slice(0, 8)}...`,
    ]),
  );

  return leaderboard.map((entry) => ({
    ...entry,
    displayName: usersById.get(entry.userId) ?? entry.displayName,
  }));
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

export async function getGroupPointsLeaderboard(
  groupId: string,
): Promise<GroupPointsEntry[]> {
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
