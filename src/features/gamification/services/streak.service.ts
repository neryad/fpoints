import { supabase } from "../../../core/supabase/client";

export type StreakSummary = {
  currentStreak: number;
  lastActiveDate: string | null;
  isActiveToday: boolean;
  isAtRisk: boolean;
  daysSinceLastActivity: number | null;
  recent7Days: Array<{
    dateKey: string;
    isActive: boolean;
  }>;
};

type ActivityRow = {
  created_at: string;
  reason: string;
  amount: number;
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

function toLocalDateKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function diffDays(from: Date, to: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

function buildStreakSummary(dateKeys: string[]): StreakSummary {
  const uniqueKeys = Array.from(new Set(dateKeys)).sort();
  const activitySet = new Set(uniqueKeys);
  const today = startOfToday();

  const recent7Days = Array.from({ length: 7 }, (_item, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;

    return {
      dateKey,
      isActive: activitySet.has(dateKey),
    };
  });

  if (dateKeys.length === 0) {
    return {
      currentStreak: 0,
      lastActiveDate: null,
      isActiveToday: false,
      isAtRisk: false,
      daysSinceLastActivity: null,
      recent7Days,
    };
  }

  const lastActiveDate = uniqueKeys[uniqueKeys.length - 1];
  const lastActive = parseDateKey(lastActiveDate);
  const daysSinceLastActivity = diffDays(lastActive, today);

  if (daysSinceLastActivity > 1) {
    return {
      currentStreak: 0,
      lastActiveDate,
      isActiveToday: false,
      isAtRisk: false,
      daysSinceLastActivity,
      recent7Days,
    };
  }

  let streak = 1;
  for (let i = uniqueKeys.length - 1; i > 0; i -= 1) {
    const current = parseDateKey(uniqueKeys[i]);
    const previous = parseDateKey(uniqueKeys[i - 1]);

    if (diffDays(previous, current) === 1) {
      streak += 1;
      continue;
    }

    break;
  }

  return {
    currentStreak: streak,
    lastActiveDate,
    isActiveToday: daysSinceLastActivity === 0,
    isAtRisk: daysSinceLastActivity === 1,
    daysSinceLastActivity,
    recent7Days,
  };
}

export async function getMyStreakSummary(
  groupId: string,
): Promise<StreakSummary> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 365);

  const { data, error } = await client
    .from("point_transactions")
    .select("created_at, reason, amount")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .gt("amount", 0)
    .like("reason", "task_approved:%")
    .gte("created_at", fromDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      "No se pudo calcular la racha. Verifica tabla/politicas de point_transactions.",
    );
  }

  const rows = (data ?? []) as ActivityRow[];
  const activityDates = rows.map((row) => toLocalDateKey(row.created_at));

  return buildStreakSummary(activityDates);
}
