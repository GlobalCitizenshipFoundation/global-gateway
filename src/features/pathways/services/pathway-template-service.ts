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
  last_updated_by: string | null; // Added last_updated_by
  is_deleted: boolean; // Added is_deleted for soft deletes
}

export interface PathwayTemplate {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  status: 'draft' | 'pending_review' | 'published' | 'archived'; // Added status
  created_at: string;
  updated_at: string;
  last_updated_by: string | null; // Added last_updated_by
  is_deleted: boolean; // Added is_deleted for soft deletes
  // New fields for template-level essential information
  application_open_date: string | null; // ISO date string
  participation_deadline: string | null; // ISO date string
  general_instructions: string | null; // Rich text content
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
    .eq("is_deleted", false) // Filter out soft-deleted templates
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
    .eq("is_deleted", false) // Filter out soft-deleted templates
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
  creator_id: string,
  status: PathwayTemplate['status'] = 'draft', // Default status to draft
  last_updated_by: string,
  // New parameters for creation
  application_open_date: string | null,
  participation_deadline: string | null,
  general_instructions: string | null
): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_templates")
    .insert([{
      name,
      description,
      is_private,
      creator_id,
      status,
      last_updated_by,
      application_open_date, // New field
      participation_deadline, // New field
      general_instructions, // New field
    }])
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
  updates: Partial<Omit<PathwayTemplate, "id" | "creator_id" | "created_at" | "is_deleted">>,
  updaterId: string // Pass updaterId for last_updated_by
): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_templates")
    .update({ ...updates, updated_at: new Date().toISOString(), last_updated_by: updaterId })
    .eq("id", id)
    .eq("is_deleted", false) // Ensure we don't update deleted templates
    .select()
    .single();

  if (error) {
    console.error(`Error updating pathway template ${id}:`, error.message);
    return null;
  }
  return data;
}

export async function softDeletePathwayTemplate(id: string, updaterId: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("pathway_templates")
    .update({ is_deleted: true, updated_at: new Date().toISOString(), last_updated_by: updaterId })
    .eq("id", id);

  if (error) {
    console.error(`Error soft deleting pathway template ${id}:`, error.message);
    return false;
  }
  return true;
}

// Hard delete function (for admin-only, if soft delete is not desired or for permanent removal)
export async function hardDeletePathwayTemplate(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("pathway_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error hard deleting pathway template ${id}:`, error.message);
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
    .eq("is_deleted", false) // Filter out soft-deleted phases
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
  config: Record<string, any> = {},
  creatorId: string // Pass creatorId for last_updated_by
): Promise<Phase | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("phases")
    .insert([
      { pathway_template_id: pathwayTemplateId, name, type, order_index, description, config, last_updated_by: creatorId },
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
  updates: Partial<Omit<Phase, "id" | "pathway_template_id" | "created_at" | "is_deleted">>,
  updaterId: string // Pass updaterId for last_updated_by
): Promise<Phase | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("phases")
    .update({ ...updates, updated_at: new Date().toISOString(), last_updated_by: updaterId })
    .eq("id", id)
    .eq("is_deleted", false) // Ensure we don't update deleted phases
    .select()
    .single();

  if (error) {
    console.error(`Error updating phase ${id}:`, error.message);
    return null;
  }
  return data;
}

// New function to update only the branching configuration of a phase
export async function updatePhaseBranchingConfig(
  id: string,
  configUpdates: Record<string, any>,
  updaterId: string // Pass updaterId for last_updated_by
): Promise<Phase | null> {
  const supabase = await getSupabase();
  // Fetch current config to merge updates
  const { data: currentPhase, error: fetchError } = await supabase
    .from("phases")
    .select("config")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (fetchError || !currentPhase) {
    console.error(`Error fetching phase ${id} for config update:`, fetchError?.message);
    return null;
  }

  const mergedConfig = { ...currentPhase.config, ...configUpdates };

  const { data, error } = await supabase
    .from("phases")
    .update({ config: mergedConfig, updated_at: new Date().toISOString(), last_updated_by: updaterId })
    .eq("id", id)
    .eq("is_deleted", false)
    .select()
    .single();

  if (error) {
    console.error(`Error updating phase branching config for ${id}:`, error.message);
    return null;
  }
  return data;
}

export async function softDeletePhase(id: string, updaterId: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("phases")
    .update({ is_deleted: true, updated_at: new Date().toISOString(), last_updated_by: updaterId })
    .eq("id", id);

  if (error) {
    console.error(`Error soft deleting phase ${id}:`, error.message);
    return false;
  }
  return true;
}

// Hard delete function (for admin-only, if soft delete is not desired or for permanent removal)
export async function hardDeletePhase(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase.from("phases").delete().eq("id", id);

  if (error) {
    console.error(`Error hard deleting phase ${id}:`, error.message);
    return false;
  }
  return true;
}

export async function clonePathwayTemplate(
  templateId: string,
  newName: string,
  creatorId: string,
  lastUpdatedBy: string // Pass lastUpdatedBy for new template and phases
): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();
  const { data: originalTemplate, error: templateError } = await supabase
    .from("pathway_templates")
    .select("*")
    .eq("id", templateId)
    .eq("is_deleted", false) // Only clone non-deleted templates
    .single();

  if (templateError || !originalTemplate) {
    console.error("Error fetching original template for cloning:", templateError?.message);
    return null;
  }

  const { data: originalPhases, error: phasesError } = await supabase
    .from("phases")
    .select("*")
    .eq("pathway_template_id", templateId)
    .eq("is_deleted", false) // Only clone non-deleted phases
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
        is_private: originalTemplate.is_private,
        status: 'draft', // Cloned template starts as draft
        creator_id: creatorId,
        last_updated_by: lastUpdatedBy,
        application_open_date: originalTemplate.application_open_date, // Copy new field
        participation_deadline: originalTemplate.participation_deadline, // Copy new field
        general_instructions: originalTemplate.general_instructions, // Copy new field
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
    last_updated_by: lastUpdatedBy, // Set last_updated_by for cloned phases
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