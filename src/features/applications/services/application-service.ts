"use server";

import { createClient } from "@/integrations/supabase/server";
import { Campaign } from "@/features/campaigns/services/campaign-service";
import { BaseConfigurableItem } from "@/features/pathway-templates/services/pathway-template-service";

// Extend BaseConfigurableItem for current_campaign_phase to reuse its structure
export interface ApplicationPhase extends BaseConfigurableItem {
  campaign_id: string;
  original_phase_id: string | null;
}

export interface Application {
  id: string;
  campaign_id: string;
  applicant_id: string;
  current_campaign_phase_id: string | null;
  status: 'draft' | 'submitted' | 'in_review' | 'accepted' | 'rejected' | 'on_hold';
  screening_status: 'Pending' | 'Accepted' | 'On Hold' | 'Denied';
  data: Record<string, any>; // JSONB field for dynamic form data
  created_at: string;
  updated_at: string;
  campaigns?: Campaign; // For joining with campaign data
  profiles?: { first_name: string; last_name: string; avatar_url: string | null }; // For joining with applicant profile data
  current_campaign_phases?: ApplicationPhase; // For joining with current phase data
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: { first_name: string; last_name: string; avatar_url: string | null }; // For joining with author profile
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getApplications(): Promise<Application[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("applications")
    .select("*, campaigns(*), profiles(first_name, last_name, avatar_url), current_campaign_phases(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error.message);
    return null;
  }
  return data as Application[];
}

export async function getApplicationById(id: string): Promise<Application | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("applications")
    .select("*, campaigns(*), profiles(first_name, last_name, avatar_url), current_campaign_phases(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching application ${id}:`, error.message);
    return null;
  }
  return data as Application;
}

export async function createApplication(
  campaignId: string,
  applicantId: string,
  initialData: Record<string, any> = {},
  initialStatus: Application['status'] = 'draft',
  initialScreeningStatus: Application['screening_status'] = 'Pending'
): Promise<Application | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("applications")
    .insert([{
      campaign_id: campaignId,
      applicant_id: applicantId,
      data: initialData,
      status: initialStatus,
      screening_status: initialScreeningStatus,
    }])
    .select("*, campaigns(*), profiles(first_name, last_name, avatar_url), current_campaign_phases(*)")
    .single();

  if (error) {
    console.error("Error creating application:", error.message);
    return null;
  }
  return data as Application;
}

export async function updateApplication(
  id: string,
  updates: Partial<Omit<Application, "id" | "applicant_id" | "campaign_id" | "created_at">>
): Promise<Application | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("applications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, campaigns(*), profiles(first_name, last_name, avatar_url), current_campaign_phases(*)")
    .single();

  if (error) {
    console.error(`Error updating application ${id}:`, error.message);
    return null;
  }
  return data as Application;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting application ${id}:`, error.message);
    return false;
  }
  return true;
}

// --- Collaborative Notes Management ---

export async function getApplicationNotes(applicationId: string): Promise<ApplicationNote[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("application_notes")
    .select("*, profiles(first_name, last_name, avatar_url)")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`Error fetching notes for application ${applicationId}:`, error.message);
    return null;
  }
  return data as ApplicationNote[];
}

// New function to get a single note by its ID
export async function getApplicationNoteById(noteId: string): Promise<ApplicationNote | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("application_notes")
    .select("*, profiles(first_name, last_name, avatar_url)")
    .eq("id", noteId)
    .single();

  if (error) {
    console.error(`Error fetching application note ${noteId}:`, error.message);
    return null;
  }
  return data as ApplicationNote;
}

export async function createApplicationNote(
  applicationId: string,
  authorId: string,
  content: string
): Promise<ApplicationNote | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("application_notes")
    .insert([{ application_id: applicationId, author_id: authorId, content }])
    .select("*, profiles(first_name, last_name, avatar_url)")
    .single();

  if (error) {
    console.error("Error creating application note:", error.message);
    return null;
  }
  return data as ApplicationNote;
}

export async function updateApplicationNote(
  noteId: string,
  updates: Partial<Omit<ApplicationNote, "id" | "application_id" | "author_id" | "created_at">>
): Promise<ApplicationNote | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("application_notes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .select("*, profiles(first_name, last_name, avatar_url)")
    .single();

  if (error) {
    console.error(`Error updating note ${noteId}:`, error.message);
    return null;
  }
  return data as ApplicationNote;
}

export async function deleteApplicationNote(noteId: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("application_notes")
    .delete()
    .eq("id", noteId);

  if (error) {
    console.error(`Error deleting note ${noteId}:`, error.message);
    return false;
  }
  return true;
}