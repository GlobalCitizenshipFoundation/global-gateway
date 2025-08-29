"use client";

import { createClient } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PathwayTemplate } from "@/features/pathway-templates/services/pathway-template-service";

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
  pathway_templates?: PathwayTemplate; // For joining with template data
}

export const campaignService = {
  supabase: createClient(),

  async getCampaigns(): Promise<Campaign[] | null> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .select("*, pathway_templates(id, name, description, is_private)") // Select related template data
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching campaigns:", error.message);
      toast.error("Failed to load campaigns.");
      return null;
    }
    return data as Campaign[];
  },

  async getCampaignById(id: string): Promise<Campaign | null> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .select("*, pathway_templates(id, name, description, is_private)")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching campaign ${id}:`, error.message);
      toast.error(`Failed to load campaign ${id}.`);
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
    creator_id: string
  ): Promise<Campaign | null> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .insert([{ name, description, pathway_template_id, start_date, end_date, is_public, status, config, creator_id }])
      .select("*, pathway_templates(id, name, description, is_private)")
      .single();

    if (error) {
      console.error("Error creating campaign:", error.message);
      toast.error("Failed to create campaign.");
      return null;
    }
    toast.success("Campaign created successfully!");
    return data as Campaign;
  },

  async updateCampaign(
    id: string,
    updates: Partial<Omit<Campaign, "id" | "creator_id" | "created_at">>
  ): Promise<Campaign | null> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, pathway_templates(id, name, description, is_private)")
      .single();

    if (error) {
      console.error(`Error updating campaign ${id}:`, error.message);
      toast.error("Failed to update campaign.");
      return null;
    }
    toast.success("Campaign updated successfully!");
    return data as Campaign;
  },

  async deleteCampaign(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting campaign ${id}:`, error.message);
      toast.error("Failed to delete campaign.");
      return false;
    }
    toast.success("Campaign deleted successfully!");
    return true;
  },
};