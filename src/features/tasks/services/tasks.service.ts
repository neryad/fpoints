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
  const { error } = await client.rpc("review_task_submission", {
    input_submission_id: submissionId,
    input_status: status,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already reviewed")) {
      throw new Error("Este envio ya fue revisado previamente.");
    }
    if (error.message.toLowerCase().includes("not authorized")) {
      throw new Error("No tienes permisos para revisar este envio.");
    }
    throw new Error(
      "No se pudo revisar el envio. Verifica la RPC review_task_submission.",
    );
  }
}

export async function getUserDisplayNames(
  userIds: string[],
  groupId?: string,
): Promise<Record<string, string>> {
  const client = ensureSupabase();
  const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean);
  if (uniqueUserIds.length === 0) return {};

  const fallback = uniqueUserIds.reduce<Record<string, string>>((acc, id) => {
    acc[id] = "Usuario sin perfil";
    return acc;
  }, {});

  if (groupId) {
    const { data: rpcData, error: rpcError } = await client.rpc(
      "get_group_user_labels",
      {
        input_group_id: groupId,
      },
    );

    if (!rpcError && rpcData) {
      const labels = { ...fallback };
      for (const row of rpcData as Array<Record<string, unknown>>) {
        const id = (row.user_id as string) ?? "";
        const displayName = (row.display_name as string) ?? "";
        if (id && labels[id] !== undefined) {
          labels[id] = displayName || labels[id];
        }
      }
      return labels;
    }
  }

  const { data, error } = await client
    .from("users")
    .select("id, name, email")
    .in("id", uniqueUserIds);

  if (error || !data) {
    return fallback;
  }

  const labels = { ...fallback };
  for (const row of data as UserProfileRow[]) {
    labels[row.id] = row.name || row.email || "Usuario sin perfil";
  }

  return labels;
}
