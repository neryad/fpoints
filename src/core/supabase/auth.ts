import { ensureSupabase } from "./client";

export async function getCurrentUserId(): Promise<string> {
  const client = ensureSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("No hay usuario autenticado.");
  return data.user.id;
}

export async function getAuthUser() {
  const client = ensureSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("No hay usuario autenticado.");
  return data.user;
}
