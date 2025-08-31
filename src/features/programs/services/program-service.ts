"use server";

import { createClient } from "@/integrations/supabase/server";
import { Program } from "@/features/campaigns/services/campaign-service"; // Reusing Program interface from campaign-service

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getPrograms(): Promise<Program[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching programs:", error.message);
    return null;
  }
  return data;
}

export async function getProgramById(id: string): Promise<Program | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching program ${id}:`, error.message);
    return null;
  }
  return data;
}

export async function createProgram(
  name: string,
  description: string | null,
  start_date: string | null,
  end_date: string | null,
  status: Program['status'],
  creator_id: string
): Promise<Program | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("programs")
    .insert([{ name, description, start_date, end_date, status, creator_id }])
    .select()
    .single();

  if (error) {
    console.error("Error creating program:", error.message);
    return null;
  }
  return data;
}

export async function updateProgram(
  id: string,
  updates: Partial<Omit<Program, "id" | "creator_id" | "created_at">>
): Promise<Program | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("programs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating program ${id}:`, error.message);
    return null;
  }
  return data;
}

export async function deleteProgram(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("programs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting program ${id}:`, error.message);
    return false;
  }
  return true;
}