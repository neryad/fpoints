import { supabase } from "../../../core/supabase/client";
import type { CreateTaskInput, Task } from "../types";

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
