// src/features/groups/services/groups.service.ts
import { supabase } from '../../../core/supabase/client';
import type { Group } from '../types';

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return supabase;
}

async function getCurrentUserId() {
  const client = ensureSupabase();
  const { data, error } = await client.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error('No hay usuario autenticado.');

  return data.user.id;
}

export async function createGroup(name: string) {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('El nombre del grupo es obligatorio.');
  }

  const { data: group, error: groupError } = await client
    .from('groups')
    .insert({
      name: trimmed,
      created_by: userId,
    })
    .select('*')
    .single();

  if (groupError) throw groupError;

  const { error: membershipError } = await client.from('memberships').insert({
    user_id: userId,
    group_id: group.id,
    role: 'owner',
  });

  if (membershipError) throw membershipError;

  return group as Group;
}

export async function listMyGroups() {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from('memberships')
    .select('group_id, role, groups(*)')
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...(row.groups as Group),
    my_role: row.role,
  }));
}

export async function joinGroupByCode(inviteCode: string) {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const code = inviteCode.trim().toUpperCase();
  if (!code) {
    throw new Error('El código de invitación es obligatorio.');
  }

  const { data: group, error: groupError } = await client
    .from('groups')
    .select('*')
    .eq('invite_code', code)
    .single();

  if (groupError) throw new Error('Código inválido o grupo no encontrado.');

  const { error: membershipError } = await client.from('memberships').insert({
    user_id: userId,
    group_id: group.id,
    role: 'member',
  });

  if (membershipError) {
    if (membershipError.code === '23505') {
      throw new Error('Ya perteneces a este grupo.');
    }
    throw membershipError;
  }

  return group as Group;
}