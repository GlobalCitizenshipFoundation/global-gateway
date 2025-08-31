"use server";

import { createClient } from "@/integrations/supabase/server";
// import { toast } from "sonner"; // Removed client-side import

// New base interface for configurable items (phases)
export interface BaseConfigurableItem {
  id: string;
  name: string;
  type: string; // e.g., 'Form', 'Review', 'Email', 'Scheduling', 'Decision', 'Recommendation'
  description: string | null;
  order_index: number;
  config: Record<string, any>; // JSONB field for phase-specific configuration
  created_at: string;
  updated_at: string;
}

export interface PathwayTemplate {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  is_private: boolean; // Added is_private field
  created_at: string;
  updated_at: string;
}

// Phase now extends BaseConfigurableItem
export interface Phase extends BaseConfigurableItem {
  pathway_template_id: string;
}

export const pathwayTemplateService = {
  // Supabase client is now created on demand for server-side operations
  async getSupabase() {
    return await createClient();
  },

  async getPathwayTemplates(): Promise<PathwayTemplate[] | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("pathway_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pathway templates:", error.message);
      return null;
    }
    return data;
  },

  async getPathwayTemplateById(id: string): Promise<PathwayTemplate | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("pathway_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching pathway template ${id}:`, error.message);
      return null;
    }
    return data;
  },

  async createPathwayTemplate(
    name: string,
    description: string | null,
    is_private: boolean, // Added is_private parameter
    creator_id: string
  ): Promise<PathwayTemplate | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("pathway_templates")
      .insert([{ name, description, is_private, creator_id }])
      .select()
      .single();

    if (error) {
      console.error("Error creating pathway template:", error.message);
      return null;
    }
    return data;
  },

  async updatePathwayTemplate(
    id: string,
    updates: Partial<Omit<PathwayTemplate, "id" | "creator_id" | "created_at">>
  ): Promise<PathwayTemplate | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("pathway_templates")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating pathway template ${id}:`, error.message);
      return null;
    }
    return data;
  },

  async deletePathwayTemplate(id: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("pathway_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting pathway template ${id}:`, error.message);
      return false;
    }
    return true;
  },

  async getPhasesByPathwayTemplateId(
    pathwayTemplateId: string
  ): Promise<Phase[] | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("phases")
      .select("*")
      .eq("pathway_template_id", pathwayTemplateId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error(
        `Error fetching phases for template ${pathwayTemplateId}:`,
        error.message
      );
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
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("phases")
      .insert([
        { pathway_template_id: pathwayTemplateId, name, type, order_index, description, config },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating phase:", error.message);
      return null;
    }
    return data;
  },

  async updatePhase(
    id: string,
    updates: Partial<Omit<Phase, "id" | "pathway_template_id" | "created_at">>
  ): Promise<Phase | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("phases")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating phase ${id}:`, error.message);
      return null;
    }
    return data;
  },

  async deletePhase(id: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { error } = await supabase.from("phases").delete().eq("id", id);

    if (error) {
      console.error(`Error deleting phase ${id}:`, error.message);
      return false;
    }
    return true;
  },

  async clonePathwayTemplate(
    templateId: string,
    newName: string,
    creatorId: string
  ): Promise<PathwayTemplate | null> {
    const supabase = await this.getSupabase();
    const { data: originalTemplate, error: templateError } = await supabase
      .from("pathway_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !originalTemplate) {
      console.error("Error fetching original template for cloning:", templateError?.message);
      return null;
    }

    const { data: originalPhases, error: phasesError } = await supabase
      .from("phases")
      .select("*")
      .eq("pathway_template_id", templateId)
      .order("order_index", { ascending: true });

    if (phasesError) {
      console.error("Error fetching original phases for cloning:", phasesError.message);
      return null;
    }

    // Create the new template
    const { data: newTemplate, error: newTemplateError } = await supabase
      .from("pathway_templates")
      .insert([
        {
          name: newName,
          description: originalTemplate.description,
          is_private: originalTemplate.is_private, // Cloned template retains privacy setting
          creator_id: creatorId, // New template owned by the cloner
        },
      ])
      .select()
      .single();

    if (newTemplateError || !newTemplate) {
      console.error("Error creating new template during cloning:", newTemplateError?.message);
      return null;
    }

    // Create new phases for the cloned template
    const newPhasesData = originalPhases.map((phase) => ({
      pathway_template_id: newTemplate.id,
      name: phase.name,
      type: phase.type,
      description: phase.description,
      order_index: phase.order_index,
      config: phase.config,
    }));

    if (newPhasesData.length > 0) {
      const { error: newPhasesError } = await supabase
        .from("phases")
        .insert(newPhasesData);

      if (newPhasesError) {
        console.error("Error creating new phases during cloning:", newPhasesError.message);
        // Optionally, delete the newly created template if phase creation fails
        await supabase.from("pathway_templates").delete().eq("id", newTemplate.id);
        return null;
      }
    }
    return newTemplate;
  },
};