"use server";

import { createClient } from "@/integrations/supabase/server";
import { Profile } from "@/types/supabase"; // Assuming Profile interface is available

export interface PhaseTask {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  assigned_to_role: string | null;
  assigned_to_user_id: string | null;
  due_date: string | null;
  status: 'pending' | 'completed';
  order_index: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile; // For joining with assigned user's profile
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getPhaseTasksByPhaseId(phaseId: string): Promise<PhaseTask[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("phase_tasks")
    .select("*, profiles(first_name, last_name, avatar_url)") // Join with profiles for assigned user
    .eq("phase_id", phaseId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error(`Error fetching phase tasks for phase ${phaseId}:`, error.message);
    return null;
  }
  return data as PhaseTask[];
}

export async function createPhaseTask(
  phaseId: string,
  name: string,
  description: string | null,
  assignedToRole: string | null,
  assignedToUserId: string | null,
  dueDate: string | null,
  orderIndex: number,
  status: PhaseTask['status'] = 'pending'
): Promise<PhaseTask | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("phase_tasks")
    .insert([
      {
        phase_id: phaseId,
        name,
        description,
        assigned_to_role: assignedToRole,
        assigned_to_user_id: assignedToUserId,
        due_date: dueDate,
        status,
        order_index: orderIndex,
      },
    ])
    .select("*, profiles(first_name, last_name, avatar_url)")
    .single();

  if (error) {
    console.error("Error creating phase task:", error.message);
    return null;
  }
  return data as PhaseTask;
}

export async function updatePhaseTask(
  id: string,
  updates: Partial<Omit<PhaseTask, "id" | "phase_id" | "created_at">>
): Promise<PhaseTask | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("phase_tasks")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, profiles(first_name, last_name, avatar_url)")
    .single();

  if (error) {
    console.error(`Error updating phase task ${id}:`, error.message);
    return null;
  }
  return data as PhaseTask;
}

export async function deletePhaseTask(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("phase_tasks")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting phase task ${id}:`, error.message);
    return false;
  }
  return true;
}