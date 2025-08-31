"use server";

import { createClient } from "@/integrations/supabase/server";
import { PathwayTemplate, BaseConfigurableItem, Phase as TemplatePhase } from "@/features/pathways/services/pathway-template-service";

// New interface for Program
export interface Program {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'draft' | 'active' | 'archived' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  pathway_template_id: string | null;
  creator_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_public: boolean;
  status: 'draft' | 'active' | 'archived' | 'completed';
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  program_id: string | null; // Added program_id
  pathway_templates?: PathwayTemplate; // For joining with template data
  programs?: Program; // For joining with program data
}

// CampaignPhase now extends BaseConfigurableItem
export interface CampaignPhase extends BaseConfigurableItem {
  campaign_id: string;
  original_phase_id: string | null; // Link to the original template phase if cloned
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getCampaigns(): Promise<Campaign[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, pathway_templates(id, name, description, is_private), programs(id, name, creator_id)") // Select related template and program data
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching campaigns:", error.message);
    return null;
  }
  return data as Campaign[];
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, pathway_templates(id, name, description, is_private), programs(id, name, creator_id)")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching campaign ${id}:`, error.message);
    return null;
  }
  return data as Campaign;
}

export async function createCampaign(
  name: string,
  description: string | null,
  pathway_template_id: string | null,
  start_date: string | null,
  end_date: string | null,
  is_public: boolean,
  status: 'draft' | 'active' | 'archived' | 'completed',
  config: Record<string, any>,
  creator_id: string,
  program_id: string | null = null
): Promise<Campaign | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .insert([{ name, description, pathway_template_id, start_date, end_date, is_public, status, config, creator_id, program_id }])
    .select("*, pathway_templates(id, name, description, is_private), programs(id, name, creator_id)")
    .single();

  if (error) {
    console.error("Error creating campaign:", error.message);
    return null;
  }
  return data as Campaign;
}

export async function updateCampaign(
  id: string,
  updates: Partial<Omit<Campaign, "id" | "creator_id" | "created_at">>
): Promise<Campaign | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, pathway_templates(id, name, description, is_private), programs(id, name, creator_id)")
    .single();

  if (error) {
    console.error(`Error updating campaign ${id}:`, error.message);
    return null;
  }
  return data as Campaign;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting campaign ${id}:`, error.message);
    return false;
  }
  return true;
}

// --- Campaign Phase Management ---

export async function getCampaignPhasesByCampaignId(campaignId: string): Promise<CampaignPhase[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("campaign_phases")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error(`Error fetching campaign phases for campaign ${campaignId}:`, error.message);
    return null;
  }
  return data;
}

export async function createCampaignPhase(
  campaignId: string,
  name: string,
  type: string,
  order_index: number,
  description: string | null = null,
  config: Record<string, any> = {},
  original_phase_id: string | null = null
): Promise<CampaignPhase | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("campaign_phases")
    .insert([
      { campaign_id: campaignId, original_phase_id, name, type, order_index, description, config },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating campaign phase:", error.message);
    return null;
  }
  return data;
}

export async function updateCampaignPhase(
  id: string,
  updates: Partial<Omit<CampaignPhase, "id" | "campaign_id" | "created_at">>
): Promise<CampaignPhase | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("campaign_phases")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating campaign phase ${id}:`, error.message);
    return null;
  }
  return data;
}

export async function deleteCampaignPhase(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("campaign_phases")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting campaign phase ${id}:`, error.message);
    return false;
  }
  return true;
}

export async function deepCopyPhasesFromTemplate(
  campaignId: string,
  templateId: string
): Promise<CampaignPhase[] | null> {
  const supabase = await getSupabase();
  // Fetch phases from the original pathway template
  const { data: templatePhases, error: fetchError } = await supabase
    .from("phases")
    .select("*")
    .eq("pathway_template_id", templateId)
    .order("order_index", { ascending: true });

  if (fetchError) {
    console.error("Error fetching template phases for deep copy:", fetchError.message);
    throw new Error("Failed to fetch template phases for deep copy.");
  }

  if (!templatePhases || templatePhases.length === 0) {
    return []; // No phases to copy
  }

  // Prepare data for insertion into campaign_phases
  const campaignPhasesToInsert = templatePhases.map((phase: TemplatePhase) => ({
    campaign_id: campaignId,
    original_phase_id: phase.id,
    name: phase.name,
    type: phase.type,
    description: phase.description,
    order_index: phase.order_index,
    config: phase.config, // Deep copy the config
  }));

  // Insert all new campaign phases
  const { data: newCampaignPhases, error: insertError } = await supabase
    .from("campaign_phases")
    .insert(campaignPhasesToInsert)
    .select("*");

  if (insertError) {
    console.error("Error inserting deep-copied campaign phases:", insertError.message);
    throw new Error("Failed to insert deep-copied campaign phases.");
  }

  return newCampaignPhases;
}