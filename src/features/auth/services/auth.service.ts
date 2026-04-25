import { supabase } from "../../../core/supabase/client";

export async function signIn() {
  throw new Error("Not implemented yet. Implement in Week 2.");
}

export async function signUp() {
  throw new Error("Not implemented yet. Implement in Week 2.");
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (data.user && data.session) {
    await ensureUserRow(data.user.id, data.user.email ?? email);
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  // When sign up returns an active session (email confirmation disabled in dev),
  // initialize the public users row immediately.
  if (data.user && data.session) {
    await ensureUserRow(data.user.id, data.user.email ?? email);
  }

  return data;
}

export async function signOut() {
  if (!supabase) {
    throw new Error("Supabase no está configurado...");
  }

  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function ensureCurrentUserRow() {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) return;

  await ensureUserRow(data.user.id, data.user.email ?? "");
}

async function ensureUserRow(userId: string, email: string) {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      email,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(
      "No se pudo inicializar el perfil de usuario. Verifica tabla/politicas de users.",
      { cause: error },
    );
  }
}
