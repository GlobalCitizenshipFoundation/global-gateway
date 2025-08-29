import { createClient } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PathwayTemplate {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  pathway_template_id: string;
  name: string;
  type: string; // e.g., 'Form', 'Review', 'Email', 'Scheduling', 'Decision', 'Recommendation'
  description: string | null;
  order_index: number;
  config: Record<string, any>; // JSONB field for phase-specific configuration
  created_at: string;
  updated_at: string;
}

export const pathwayTemplateService = {
  supabase: createClient(),

  async getPathwayTemplates(): Promise<PathwayTemplate[] | null> {
    const { data, error } = await this.supabase
      .from("pathway_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pathway templates:", error.message);
      toast.error("Failed to load pathway templates.");
      return null;
    }
    return data;
  },

  async getPathwayTemplateById(id: string): Promise<PathwayTemplate | null> {
    const { data, error } = await this.supabase
      .from("pathway_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching pathway template ${id}:`, error.message);
      toast.error(`Failed to load pathway template ${id}.`);
      return null;
    }
    return data;
  },

  async createPathwayTemplate(
    name: string,
    description: string | null,
    creator_id: string
  ): Promise<PathwayTemplate | null> {
    const { data, error } = await this.supabase
      .from("pathway_templates")
      .insert([{ name, description, creator_id }])
      .select()
      .single();

    if (error) {
      console.error("Error creating pathway template:", error.message);
      toast.error("Failed to create pathway template.");
      return null;
    }
    toast.success("Pathway template created successfully!");
    return data;
  },

  async updatePathwayTemplate(
    id: string,
    updates: Partial<Omit<PathwayTemplate, "id" | "creator_id" | "created_at">>
  ): Promise<PathwayTemplate | null> {
    const { data, error } = await this.supabase
      .from("pathway_templates")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating pathway template ${id}:`, error.message);
      toast.error("Failed to update pathway template.");
      return null;
    }
    toast.success("Pathway template updated successfully!");
    return data;
  },

  async deletePathwayTemplate(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("pathway_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting pathway template ${id}:`, error.message);
      toast.error("Failed to delete pathway template.");
      return false;
    }
    toast.success("Pathway template deleted successfully!");
    return true;
  },

  async getPhasesByPathwayTemplateId(
    pathwayTemplateId: string
  ): Promise<Phase[] | null> {
    const { data, error } = await this.supabase
      .from("phases")
      .select("*")
      .eq("pathway_template_id", pathwayTemplateId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error(
        `Error fetching phases for template ${pathwayTemplateId}:`,
        error.message
      );
      toast.error("Failed to load phases.");
      return null;
    }
    return data;
  },

  async createPhase(
    pathwayTemplateId: string,
    name: string,
    type: string,
    order_index: number,
    description: string | null = null,
    config: Record<string, any> = {}
  ): Promise<Phase | null> {
    const { data, error } = await this.supabase
      .from("phases")
      .insert([
        { pathway_template_id: pathwayTemplateId, name, type, order_index, description, config },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating phase:", error.message);
      toast.error("Failed to create phase.");
      return null;
    }
    toast.success("Phase created successfully!");
    return data;
  },

  async updatePhase(
    id: string,
    updates: Partial<Omit<Phase, "id" | "pathway_template_id" | "created_at">>
  ): Promise<Phase | null> {
    const { data, error } = await this.supabase
      .from("phases")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating phase ${id}:`, error.message);
      toast.error("Failed to update phase.");
      return null;
    }
    toast.success("Phase updated successfully!");
    return data;
  },

  async deletePhase(id: string): Promise<boolean> {
    const { error } = await this.supabase.from("phases").delete().eq("id", id);

    if (error) {
      console.error(`Error deleting phase ${id}:`, error.message);
      toast.error("Failed to delete phase.");
      return false;
    }
    toast.success("Phase deleted successfully!");
    return true;
  },
};