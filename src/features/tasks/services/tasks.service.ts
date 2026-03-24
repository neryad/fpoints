import { supabase } from "../../../core/supabase/client";
import type { GroupRole } from "../../groups/types";
import type {
  CreateTaskInput,
  CreateTaskSubmissionInput,
  Task,
  TaskSubmission,
  TaskSubmissionStatus,
} from "../types";

type UserProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
};

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
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

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    pointsValue: row.points_value as number,
    createdBy: row.created_by as string,
    requiresProof: row.requires_proof as boolean,
    assignedTo: (row.assigned_to as string) ?? null,
    status: row.status as Task["status"],
    createdAt: row.created_at as string,
  };
}

function mapTaskSubmission(row: Record<string, unknown>): TaskSubmission {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    userId: row.user_id as string,
    note: (row.note as string) ?? null,
    proofImageUrl: (row.proof_image_url as string) ?? null,
    status: row.status as TaskSubmission["status"],
    reviewedBy: (row.reviewed_by as string) ?? null,
    reviewedAt: (row.reviewed_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function createTask(
  groupId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const title = input.title.trim();
  if (!title) throw new Error("El título de la tarea es obligatorio.");

  const points = input.pointsValue;
  if (!Number.isInteger(points) || points <= 0) {
    throw new Error("Los puntos deben ser un número entero mayor a 0.");
  }

  const { data, error } = await client
    .from("tasks")
    .insert({
      group_id: groupId,
      title,
      description: input.description?.trim() || null,
      points_value: points,
      created_by: userId,
      requires_proof: input.requiresProof,
      assigned_to: input.assignedTo ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapTask(data);
}

export async function listGroupTasks(groupId: string): Promise<Task[]> {
  const client = ensureSupabase();

  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTask);
}

export async function getTask(taskId: string): Promise<Task> {
  const client = ensureSupabase();

  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (error) throw error;
  return mapTask(data);
}

export async function createTaskSubmission(
  taskId: string,
  input: CreateTaskSubmissionInput,
): Promise<TaskSubmission> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from("task_submissions")
    .insert({
      task_id: taskId,
      user_id: userId,
      note: input.note?.trim() || null,
      proof_image_url: input.proofImageUrl?.trim() || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapTaskSubmission(data);
}

export async function listMyTaskSubmissions(
  taskId: string,
): Promise<TaskSubmission[]> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from("task_submissions")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTaskSubmission);
}

export async function listTaskSubmissions(
  taskId: string,
): Promise<TaskSubmission[]> {
  const client = ensureSupabase();

  const { data, error } = await client
    .from("task_submissions")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTaskSubmission);
}

export async function getMyRoleInGroup(
  groupId: string,
): Promise<GroupRole | null> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from("memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.role as GroupRole | undefined) ?? null;
}

export async function reviewTaskSubmission(
  submissionId: string,
  status: Exclude<TaskSubmissionStatus, "pending">,
): Promise<void> {
  const client = ensureSupabase();
  const reviewerId = await getCurrentUserId();

  const { data, error } = await client
    .from("task_submissions")
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Este envio ya fue revisado previamente.");
  }
}

export async function registerApprovedSubmissionPoints(
  submission: TaskSubmission,
  task: Task,
): Promise<void> {
  const client = ensureSupabase();
  const reason = `task_approved:${submission.id}`;

  // Idempotency guard: one points transaction per approved submission.
  const { data: existing, error: existingError } = await client
    .from("point_transactions")
    .select("id")
    .eq("reason", reason)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      "No se pudo validar transacciones de puntos. Revisa tabla/politicas de point_transactions.",
    );
  }

  if (existing) return;

  const { error } = await client.from("point_transactions").insert({
    user_id: submission.userId,
    group_id: task.groupId,
    amount: task.pointsValue,
    reason,
  });

  if (error) {
    throw new Error(
      "No se pudieron registrar puntos. Revisa esquema y RLS de point_transactions.",
    );
  }
}

export async function getUserDisplayNames(
  userIds: string[],
): Promise<Record<string, string>> {
  const client = ensureSupabase();
  const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean);
  if (uniqueUserIds.length === 0) return {};

  const fallback = uniqueUserIds.reduce<Record<string, string>>((acc, id) => {
    acc[id] = `${id.slice(0, 8)}...`;
    return acc;
  }, {});

  const { data, error } = await client
    .from("users")
    .select("id, name, email")
    .in("id", uniqueUserIds);

  if (error || !data) {
    return fallback;
  }

  const labels = { ...fallback };
  for (const row of data as UserProfileRow[]) {
    labels[row.id] = row.name || row.email || labels[row.id];
  }

  return labels;
}
