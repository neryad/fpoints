import { supabase } from "../../../core/supabase/client";

export async function signIn() {
  throw new Error('Not implemented yet. Implement in Week 2.');
}

export async function signUp() {
  throw new Error('Not implemented yet. Implement in Week 2.');
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    console.log(supabase);
    throw new Error(
      "Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
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