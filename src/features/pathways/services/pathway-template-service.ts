"use server";

import { createClient } from "@/integrations/supabase/server";
import { PathwayTemplate, Phase, BaseConfigurableItem } from "@/types/supabase"; // Import from types/supabase

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

// Define the common select string for pathway templates to include joined profiles
// Corrected syntax for nested joins to profiles via auth.users
const pathwayTemplateSelect = `
  *,
  creator_profile:auth.users!pathway_templates_creator_id_fkey(profiles(first_name, last_name, avatar_url)),
  last_updater_profile:auth.users!pathway_templates_last_updated_by_fkey(profiles(first_name, last_name, avatar_url))
`;

export async function getPathwayTemplates(): Promise<PathwayTemplate[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_templates")
    .select(pathwayTemplateSelect) // Use the common select string
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[pathway-template-service] getPathwayTemplates - Error fetching templates:", error.message); // LOG ADDED
    return null;
  }
  console.log("[pathway-template-service] getPathwayTemplates - Fetched data:", data); // LOG ADDED
  return data as unknown as PathwayTemplate[]; // Explicitly cast to unknown then PathwayTemplate[]
}

export async function getPathwayTemplateById(id: string): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_templates")
    .select(pathwayTemplateSelect) // Use the common select string
    .eq("id", id)
    .single();

  if (error) {
    console.error(`[pathway-template-service] getPathwayTemplateById(${id}) - Error fetching template:`, error.message); // LOG ADDED
    return null;
  }
  console.log(`[pathway-template-service] getPathwayTemplateById(${id}) - Fetched data:`, data); // LOG ADDED
  return data as unknown as PathwayTemplate; // Explicitly cast to unknown then PathwayTemplate
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
  console.log("[pathway-template-service] createPathwayTemplate - Attempting insert with:", { name, description, is_private, creator_id, status, last_updated_by, application_open_date, participation_deadline, general_instructions, is_visible_to_applicants, tags }); // LOG ADDED
  console.log("[pathway-template-service] createPathwayTemplate - Executing Supabase insert...");

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
    .select(pathwayTemplateSelect) // Use the common select string for return
    .single();

  if (error) {
    console.error("[pathway-template-service] createPathwayTemplate - Error inserting template:", error.message); // LOG ADDED
    // --- START DYAD FIX ---
    throw error; // Throw the error so the calling action can catch it
    // --- END DYAD FIX ---
  }
  console.log("[pathway-template-service] createPathwayTemplate - Insert successful, data:", data); // LOG ADDED
  return data as unknown as PathwayTemplate; // Explicitly cast to unknown then PathwayTemplate
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
    .select(pathwayTemplateSelect) // Use the common select string for return
    .single();

  if (error) {
    console.error(`[pathway-template-service] updatePathwayTemplate(${id}) - Error updating template:`, error.message); // LOG ADDED
    return null;
  }
  console.log(`[pathway-template-service] updatePathwayTemplate(${id}) - Update successful, data:`, data); // LOG ADDED
  return data as unknown as PathwayTemplate; // Explicitly cast to unknown then PathwayTemplate
}

export async function deletePathwayTemplate(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("pathway_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`[pathway-template-service] deletePathwayTemplate(${id}) - Error deleting template:`, error.message); // LOG ADDED
    return false;
  }
  console.log(`[pathway-template-service] deletePathwayTemplate(${id}) - Delete successful.`); // LOG ADDED
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
      `[pathway-template-service] getPhasesByPathwayTemplateId(${pathwayTemplateId}) - Error fetching phases:`,
      error.message
    ); // LOG ADDED
    return null;
  }
  console.log(`[pathway-template-service] getPhasesByPathwayTemplateId(${pathwayTemplateId}) - Fetched data:`, data); // LOG ADDED
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
    console.error("[pathway-template-service] createPhase - Error creating phase:", error.message); // LOG ADDED
    return null;
  }
  console.log("[pathway-template-service] createPhase - Insert successful, data:", data); // LOG ADDED
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
    console.error(`[pathway-template-service] updatePhase(${id}) - Error updating phase:`, error.message); // LOG ADDED
    return null;
  }
  console.log(`[pathway-template-service] updatePhase(${id}) - Update successful, data:`, data); // LOG ADDED
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
    console.error(`[pathway-template-service] updatePhaseBranchingConfig(${id}) - Error fetching phase for config update:`, fetchError?.message); // LOG ADDED
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
    console.error(`[pathway-template-service] updatePhaseBranchingConfig(${id}) - Error updating phase branching config:`, error.message); // LOG ADDED
    return null;
  }
  console.log(`[pathway-template-service] updatePhaseBranchingConfig(${id}) - Update successful, data:`, data); // LOG ADDED
  return data;
}

export async function deletePhase(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase.from("phases").delete().eq("id", id);

  if (error) {
    console.error(`[pathway-template-service] deletePhase(${id}) - Error deleting phase:`, error.message); // LOG ADDED
    return false;
  }
  console.log(`[pathway-template-service] deletePhase(${id}) - Delete successful.`); // LOG ADDED
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
    console.error("[pathway-template-service] clonePathwayTemplate - Error fetching original template for cloning:", templateError?.message); // LOG ADDED
    return null;
  }

  const { data: originalPhases, error: phasesError } = await supabase
    .from("phases")
    .select("*")
    .eq("pathway_template_id", templateId)
    .order("order_index", { ascending: true });

  if (phasesError) {
    console.error("[pathway-template-service] clonePathwayTemplate - Error fetching original phases for cloning:", phasesError.message); // LOG ADDED
    return null;
  }

  // Create the new template
  const { data: newTemplateData, error: newTemplateError } = await supabase
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
    .select(pathwayTemplateSelect) // Use the common select string for return
    .single();

  if (newTemplateError || !newTemplateData) {
    console.error("[pathway-template-service] clonePathwayTemplate - Error creating new template during cloning:", newTemplateError?.message); // LOG ADDED
    return null;
  }
  const newTemplate = newTemplateData as unknown as PathwayTemplate; // Explicitly cast to unknown then PathwayTemplate

  console.log("[pathway-template-service] clonePathwayTemplate - New template created during cloning:", newTemplate); // LOG ADDED

  // Create new phases for the cloned template
  const newPhasesData = originalPhases.map((phase) => ({
    pathway_template_id: newTemplate.id, // Access id from the explicitly cast newTemplate
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
      console.error("[pathway-template-service] clonePathwayTemplate - Error creating new phases during cloning:", newPhasesError.message); // LOG ADDED
      // Optionally, delete the newly created template if phase creation fails
      await supabase.from("pathway_templates").delete().eq("id", newTemplate.id); // Access id from the explicitly cast newTemplate
      return null;
    }
    console.log("[pathway-template-service] clonePathwayTemplate - New phases created during cloning:", newPhasesData); // LOG ADDED
  }
  return newTemplate; // Explicitly cast to PathwayTemplate
}