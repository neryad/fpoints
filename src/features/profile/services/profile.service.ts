import { ensureSupabase } from "../../../core/supabase/client";
import { getAuthUser } from "../../../core/supabase/auth";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

function mapProfileRow(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: (row.email as string) ?? "",
    name: (row.name as string) ?? null,
    avatarUrl: (row.avatar_url as string) ?? null,
  };
}

export async function getMyProfile(): Promise<UserProfile> {
  const client = ensureSupabase();
  const user = await getAuthUser();

  const { data, error } = await client
    .from("users")
    .select("id, email, name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      "No se pudo cargar el perfil. Verifica tabla/politicas de users.",
    );
  }

  if (!data) {
    return {
      id: user.id,
      email: user.email ?? "",
      name: null,
      avatarUrl: null,
    };
  }

  return mapProfileRow(data as Record<string, unknown>);
}

export async function saveMyProfile(input: {
  name: string;
  avatarUrl: string;
}): Promise<UserProfile> {
  const client = ensureSupabase();
  const user = await getAuthUser();

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre es obligatorio.");
  }

  const avatarUrl = input.avatarUrl.trim();

  const { data, error } = await client
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        name,
        avatar_url: avatarUrl || null,
      },
      { onConflict: "id" },
    )
    .select("id, email, name, avatar_url")
    .single();

  if (error) {
    throw new Error(
      "No se pudo guardar el perfil. Verifica tabla/politicas de users.",
    );
  }

  return mapProfileRow(data as Record<string, unknown>);
}
