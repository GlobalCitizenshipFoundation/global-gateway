"use server";

import { createClient } from "@/integrations/supabase/server";

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
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

// Phase now extends BaseConfigurableItem
export interface Phase extends BaseConfigurableItem {
  pathway_template_id: string;
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getPathwayTemplates(): Promise<PathwayTemplate[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pathway templates:", error.message);
    return null;
  }
  return data;
}

export async function getPathwayTemplateById(id: string): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();
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
}

export async function createPathwayTemplate(
  name: string,
  description: string | null,
  is_private: boolean,
  creator_id: string
): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();
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
}

export async function updatePathwayTemplate(
  id: string,
  updates: Partial<Omit<PathwayTemplate, "id" | "creator_id" | "created_at">>
): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();
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
}

export async function deletePathwayTemplate(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("pathway_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting pathway template ${id}:`, error.message);
    return false;
  }
  return true;
}

export async function getPhasesByPathwayTemplateId(
  pathwayTemplateId: string
): Promise<Phase[] | null> {
  const supabase = await getSupabase();
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
}

export async function createPhase(
  pathwayTemplateId: string,
  name: string,
  type: string,
  order_index: number,
  description: string | null = null,
  config: Record<string, any> = {}
): Promise<Phase | null> {
  const supabase = await getSupabase();
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
}

export async function updatePhase(
  id: string,
  updates: Partial<Omit<Phase, "id" | "pathway_template_id" | "created_at">>
): Promise<Phase | null> {
  const supabase = await getSupabase();
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
}

export async function deletePhase(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase.from("phases").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting phase ${id}:`, error.message);
    return false;
  }
  return true;
}

export async function clonePathwayTemplate(
  templateId: string,
  newName: string,
  creatorId: string
): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();
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
}