"use server"; // Changed to server-only

import { createClient } from "@/integrations/supabase/server"; // Changed to server-side client
import { toast } from "sonner"; // Keep toast for client-side calls, but remove from server-only functions
import { PathwayTemplate, BaseConfigurableItem, Phase as TemplatePhase } from "@/features/pathway-templates/services/pathway-template-service";

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

export const campaignService = {
  // Supabase client is now created on demand for server-side operations
  async getSupabase() {
    return await createClient();
  },

  async getCampaigns(): Promise<Campaign[] | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, pathway_templates(id, name, description, is_private), programs(id, name, creator_id)") // Select related template and program data
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching campaigns:", error.message);
      // toast.error("Failed to load campaigns."); // Cannot use toast in server-only service
      return null;
    }
    return data as Campaign[];
  },

  async getCampaignById(id: string): Promise<Campaign | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, pathway_templates(id, name, description, is_private), programs(id, name, creator_id)")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching campaign ${id}:`, error.message);
      // toast.error(`Failed to load campaign ${id}.`); // Cannot use toast in server-only service
      return null;
    }
    return data as Campaign;
  },

  async createCampaign(
    name: string,
    description: string | null,
    pathway_template_id: string | null,
    start_date: string | null,
    end_date: string | null,
    is_public: boolean,
    status: 'draft' | 'active' | 'archived' | 'completed',
    config: Record<string, any>,
    creator_id: string,
    program_id: string | null = null // Added program_id parameter
  ): Promise<Campaign | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("campaigns")
      .insert([{ name, description, pathway_template_id, start_date, end_date, is_public, status, config, creator_id, program_id }]) // Included program_id
      .select("*, pathway_templates(id, name, description, is_private), programs(id, name, creator_id)")
      .single();

    if (error) {
      console.error("Error creating campaign:", error.message);
      // toast.error("Failed to create campaign."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Campaign created successfully!"); // Cannot use toast in server-only service
    return data as Campaign;
  },

  async updateCampaign(
    id: string,
    updates: Partial<Omit<Campaign, "id" | "creator_id" | "created_at">>
  ): Promise<Campaign | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("campaigns")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, pathway_templates(id, name, description, is_private), programs(id, name, creator_id)")
      .single();

    if (error) {
      console.error(`Error updating campaign ${id}:`, error.message);
      // toast.error("Failed to update campaign."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Campaign updated successfully!"); // Cannot use toast in server-only service
    return data as Campaign;
  },

  async deleteCampaign(id: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting campaign ${id}:`, error.message);
      // toast.error("Failed to delete campaign."); // Cannot use toast in server-only service
      return false;
    }
    // toast.success("Campaign deleted successfully!"); // Cannot use toast in server-only service
    return true;
  },

  // --- Campaign Phase Management ---

  async getCampaignPhasesByCampaignId(campaignId: string): Promise<CampaignPhase[] | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("campaign_phases")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error(`Error fetching campaign phases for campaign ${campaignId}:`, error.message);
      // toast.error("Failed to load campaign phases."); // Cannot use toast in server-only service
      return null;
    }
    return data;
  },

  async createCampaignPhase(
    campaignId: string,
    name: string,
    type: string,
    order_index: number,
    description: string | null = null,
    config: Record<string, any> = {},
    original_phase_id: string | null = null
  ): Promise<CampaignPhase | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("campaign_phases")
      .insert([
        { campaign_id: campaignId, original_phase_id, name, type, order_index, description, config },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating campaign phase:", error.message);
      // toast.error("Failed to create campaign phase."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Campaign phase created successfully!"); // Cannot use toast in server-only service
    return data;
  },

  async updateCampaignPhase(
    id: string,
    updates: Partial<Omit<CampaignPhase, "id" | "campaign_id" | "created_at">>
  ): Promise<CampaignPhase | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("campaign_phases")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating campaign phase ${id}:`, error.message);
      // toast.error("Failed to update campaign phase."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Campaign phase updated successfully!"); // Cannot use toast in server-only service
    return data;
  },

  async deleteCampaignPhase(id: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("campaign_phases")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting campaign phase ${id}:`, error.message);
      // toast.error("Failed to delete campaign phase."); // Cannot use toast in server-only service
      return false;
    }
    // toast.success("Campaign phase deleted successfully!"); // Cannot use toast in server-only service
    return true;
  },

  async deepCopyPhasesFromTemplate(
    campaignId: string,
    templateId: string
  ): Promise<CampaignPhase[] | null> {
    const supabase = await this.getSupabase();
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
  },
};