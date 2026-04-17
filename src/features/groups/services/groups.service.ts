// src/features/groups/services/groups.service.ts
import { ensureSupabase } from "../../../core/supabase/client";
import { getCurrentUserId } from "../../../core/supabase/auth";
import type { Group } from "../types";

export async function createGroup(name: string) {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("El nombre del grupo es obligatorio.");
  }

  const { data: group, error: groupError } = await client
    .from("groups")
    .insert({
      name: trimmed,
      created_by: userId,
    })
    .select("*")
    .single();

  if (groupError) {
    console.error("Error creating group:", groupError);
    throw groupError;
  }

  const { error: membershipError } = await client.from("memberships").insert({
    user_id: userId,
    group_id: group.id,
    role: "owner",
  });

  if (membershipError) throw membershipError;

  return group as Group;
}

export async function listMyGroups() {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from("memberships")
    .select("group_id, role, groups(*)")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...(row.groups as Group),
    my_role: row.role,
  }));
}

export async function joinGroupByCode(inviteCode: string) {
  const client = ensureSupabase();

  const code = inviteCode.trim().toUpperCase();
  if (!code) {
    throw new Error("El código de invitación es obligatorio.");
  }

  const { data, error } = await client.rpc("join_group_by_code", {
    input_code: code,
  });

  if (error) {
    if (error.message.includes("Group not found")) {
      throw new Error("Código inválido o grupo no encontrado.");
    }
    throw error;
  }

  return data as Group;
}

export type GroupMember = {
  userId: string;
  role: string;
  displayName: string;
};

export async function getGroupDetails(
  groupId: string,
): Promise<{ id: string; name: string; invite_code: string }> {
  const client = ensureSupabase();

  const { data, error } = await client
    .from("groups")
    .select("id, name, invite_code")
    .eq("id", groupId)
    .single();

  if (error) {
    throw new Error("No se pudo cargar la información del grupo.");
  }

  return data as { id: string; name: string; invite_code: string };
}

export async function updateGroupName(
  groupId: string,
  name: string,
): Promise<void> {
  const client = ensureSupabase();

  const trimmed = name.trim();
  if (!trimmed) throw new Error("El nombre del grupo es obligatorio.");

  const { error } = await client
    .from("groups")
    .update({ name: trimmed })
    .eq("id", groupId);

  if (error) {
    throw new Error("No se pudo actualizar el nombre del grupo.");
  }
}

export async function listGroupMembers(
  groupId: string,
): Promise<GroupMember[]> {
  const client = ensureSupabase();

  const { data: memberships, error: mError } = await client
    .from("memberships")
    .select("user_id, role")
    .eq("group_id", groupId);

  if (mError) {
    throw new Error("No se pudieron cargar los miembros del grupo.");
  }

  const members = (memberships ?? []) as Array<{
    user_id: string;
    role: string;
  }>;
  if (members.length === 0) return [];

  const { data: rpcData } = await client.rpc("get_group_user_labels", {
    input_group_id: groupId,
  });

  const labelsById = new Map<string, string>();
  for (const row of (rpcData ?? []) as Array<Record<string, unknown>>) {
    const id = row.user_id as string;
    const displayName = row.display_name as string;
    if (id) labelsById.set(id, displayName || "Usuario sin perfil");
  }

  return members.map((m) => ({
    userId: m.user_id,
    role: m.role,
    displayName: labelsById.get(m.user_id) ?? "Usuario sin perfil",
  }));
}
