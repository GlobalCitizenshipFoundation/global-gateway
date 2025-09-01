"use server";

import { createClient } from "@/integrations/supabase/server";
import { PathwayTemplate, Phase, BaseConfigurableItem } from "@/types/supabase"; // Import from types/supabase

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getPathwayTemplates(): Promise<PathwayTemplate[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_templates")
    .select("*, creator_profile:profiles!pathway_templates_creator_id_fkey(first_name, last_name, avatar_url), last_updater_profile:profiles!pathway_templates_last_updated_by_fkey(first_name, last_name, avatar_url)")
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
    .select("*, creator_profile:profiles!pathway_templates_creator_id_fkey(first_name, last_name, avatar_url), last_updater_profile:profiles!pathway_templates_last_updated_by_fkey(first_name, last_name, avatar_url)")
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
  creator_id: string,
  status: PathwayTemplate['status'] = 'draft',
  last_updated_by: string,
  application_open_date: string | null,
  participation_deadline: string | null,
  general_instructions: string | null,
  is_visible_to_applicants: boolean,
  tags: string[] | null // Added tags parameter
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
      application_open_date,
      participation_deadline,
      general_instructions,
      is_visible_to_applicants,
      tags, // Include tags in the insert statement
    }])
    .select("*, creator_profile:profiles!pathway_templates_creator_id_fkey(first_name, last_name, avatar_url), last_updater_profile:profiles!pathway_templates_last_updated_by_fkey(first_name, last_name, avatar_url)")
    .single();

  if (error) {
    console.error("Error creating pathway template:", error.message);
    return null;
  }
  return data;
}

export async function updatePathwayTemplate(
  id: string,
  updates: Partial<Omit<PathwayTemplate, "id" | "creator_id" | "created_at" | "creator_profile" | "last_updater_profile">>, // Exclude joined profiles from updates
  updaterId: string
): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_templates")
    .update({ ...updates, updated_at: new Date().toISOString(), last_updated_by: updaterId })
    .eq("id", id)
    .select("*, creator_profile:profiles!pathway_templates_creator_id_fkey(first_name, last_name, avatar_url), last_updater_profile:profiles!pathway_templates_last_updated_by_fkey(first_name, last_name, avatar_url)")
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
  config: Record<string, any> = {},
  creatorId: string,
  phase_start_date: string | null,
  phase_end_date: string | null,
  applicant_instructions: string | null,
  manager_instructions: string | null,
  is_visible_to_applicants: boolean
): Promise<Phase | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("phases")
    .insert([
      {
        pathway_template_id: pathwayTemplateId,
        name,
        type,
        order_index,
        description,
        config,
        last_updated_by: creatorId,
        phase_start_date,
        phase_end_date,
        applicant_instructions,
        manager_instructions,
        is_visible_to_applicants,
      },
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
  updates: Partial<Omit<Phase, "id" | "pathway_template_id" | "created_at">>,
  updaterId: string
): Promise<Phase | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("phases")
    .update({ ...updates, updated_at: new Date().toISOString(), last_updated_by: updaterId })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating phase ${id}:`, error.message);
    return null;
  }
  return data;
}

export async function updatePhaseBranchingConfig(
  id: string,
  configUpdates: Record<string, any>,
  updaterId: string
): Promise<Phase | null> {
  const supabase = await getSupabase();
  // Fetch current config to merge updates
  const { data: currentPhase, error: fetchError } = await supabase
    .from("phases")
    .select("config")
    .eq("id", id)
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
    .select()
    .single();

  if (error) {
    console.error(`Error updating phase branching config for ${id}:`, error.message);
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
  creatorId: string,
  lastUpdatedBy: string
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
        is_private: originalTemplate.is_private,
        status: 'draft', // Cloned template starts as draft
        creator_id: creatorId,
        last_updated_by: lastUpdatedBy,
        application_open_date: originalTemplate.application_open_date,
        participation_deadline: originalTemplate.participation_deadline,
        general_instructions: originalTemplate.general_instructions,
        is_visible_to_applicants: originalTemplate.is_visible_to_applicants,
        tags: originalTemplate.tags, // Include tags from original template
      },
    ])
    .select("*, creator_profile:profiles!pathway_templates_creator_id_fkey(first_name, last_name, avatar_url), last_updater_profile:profiles!pathway_templates_last_updated_by_fkey(first_name, last_name, avatar_url)")
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
    last_updated_by: lastUpdatedBy,
    phase_start_date: phase.phase_start_date,
    phase_end_date: phase.phase_end_date,
    applicant_instructions: phase.applicant_instructions,
    manager_instructions: phase.manager_instructions,
    is_visible_to_applicants: phase.is_visible_to_applicants,
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