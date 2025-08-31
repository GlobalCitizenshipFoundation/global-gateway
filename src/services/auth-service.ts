"use server";

import { createClient } from "@/integrations/supabase/server";

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error.message);
    throw error;
  }
}

export async function getUser(): Promise<any | null> { // Using any for user type for now, can be refined later
  const supabase = await getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }
  return user;
}

export async function getSession(): Promise<any | null> { // Using any for session type for now, can be refined later
  const supabase = await getSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error.message);
    return null;
  }
  return session;
}