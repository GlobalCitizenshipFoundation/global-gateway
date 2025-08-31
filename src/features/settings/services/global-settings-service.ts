"use server";

import { createClient } from "@/integrations/supabase/server";

export interface GlobalSetting {
  key: string;
  value: Record<string, any>; // JSONB field for the setting value
  description: string | null;
  updated_at: string;
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getGlobalSetting(key: string): Promise<GlobalSetting | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("global_settings")
    .select("*")
    .eq("key", key)
    .single();

  if (error) {
    console.error(`Error fetching global setting ${key}:`, error.message);
    return null;
  }
  return data as GlobalSetting;
}

export async function updateGlobalSetting(
  key: string,
  value: Record<string, any>,
  description: string | null = null
): Promise<GlobalSetting | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("global_settings")
    .upsert(
      { key, value, description, updated_at: new Date().toISOString() },
      { onConflict: 'key' } // Update if key exists, insert if not
    )
    .select("*")
    .single();

  if (error) {
    console.error(`Error updating global setting ${key}:`, error.message);
    return null;
  }
  return data as GlobalSetting;
}