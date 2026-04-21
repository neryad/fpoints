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

// Generates the internal email used for child accounts (never shown to users)
function childEmail(username: string): string {
  return `child_${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@fpoints.app`;
}

export async function signInWithUsername(username: string, pin: string) {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const { data: emailData, error: lookupError } = await supabase.rpc(
    "get_auth_email_by_username",
    { p_username: username.trim().toLowerCase() },
  );

  if (lookupError || !emailData) {
    const err = new Error("Cuenta no encontrada.");
    (err as any).notFound = true;
    throw err;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailData as string,
    password: pin,
  });

  if (error) {
    throw new Error("Usuario o PIN incorrecto.");
  }

  return data;
}

// Called on first login with a child invitation — creates the auth account and joins the group
export async function setupChildAccount(
  username: string,
  pin: string,
): Promise<{ groupId: string }> {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const { data: groupId, error: claimError } = await supabase.rpc(
    "claim_child_invitation",
    { p_username: username.trim().toLowerCase(), p_pin: pin },
  );

  if (claimError || !groupId) {
    throw new Error("Usuario o PIN incorrecto, o la invitación ya fue usada.");
  }

  const email = childEmail(username);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: pin,
  });

  if (signUpError) throw signUpError;
  if (!signUpData.user || !signUpData.session) {
    throw new Error("No se pudo crear la cuenta. Intenta de nuevo.");
  }

  await ensureUserRow(signUpData.user.id, email);

  const { error: joinError } = await supabase.rpc("join_group_as_child", {
    p_group_id: groupId as string,
    p_username: username.trim().toLowerCase(),
    p_display_name: username.trim(),
  });

  if (joinError) throw joinError;

  return { groupId: groupId as string };
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
