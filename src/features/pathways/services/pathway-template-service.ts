"use server";

import { createClient } from "@/integrations/supabase/server";
import { PathwayTemplate, Phase, BaseConfigurableItem, Profile } from "@/types/supabase"; // Import Profile

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

// Define a base select string for pathway templates to include basic user info (id, email)
// We will fetch full profile details in a separate step.
const pathwayTemplateBaseSelect = `
  *,
  creator_user:creator_id(id, email),
  last_updater_user:last_updated_by(id, email)
`;

export async function getPathwayTemplates(): Promise<PathwayTemplate[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_templates")
    .select(pathwayTemplateBaseSelect) // Use the base select string
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[pathway-template-service] getPathwayTemplates - Error fetching templates:", error.message);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Extract unique user IDs from creator_id and last_updated_by
  const userIds = new Set<string>();
  data.forEach((template: any) => {
    if (template.creator_user?.id) userIds.add(template.creator_user.id);
    if (template.last_updater_user?.id) userIds.add(template.last_updater_user.id);
  });

  let profilesMap = new Map<string, Profile>();
  if (userIds.size > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", Array.from(userIds));

    if (profilesError) {
      console.error("[pathway-template-service] getPathwayTemplates - Error fetching profiles:", profilesError.message);
      // Continue without profiles if there's an error
    } else if (profilesData) {
      profilesData.forEach(p => profilesMap.set(p.id, p as Profile));
    }
  }

  // Manually merge profile data
  const enrichedData = data.map((template: any) => {
    const creatorProfile = template.creator_user?.id ? profilesMap.get(template.creator_user.id) : null;
    const lastUpdaterProfile = template.last_updater_user?.id ? profilesMap.get(template.last_updater_user.id) : null;

    return {
      ...template,
      creator_profile: creatorProfile ? { ...creatorProfile, email: template.creator_user.email } : null,
      last_updater_profile: lastUpdaterProfile ? { ...lastUpdaterProfile, email: template.last_updater_user.email } : null,
    } as PathwayTemplate;
  });

  console.log("[pathway-template-service] getPathwayTemplates - Fetched and enriched data:", enrichedData);
  return enrichedData;
}

export async function getPathwayTemplateById(id: string): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_templates")
    .select(pathwayTemplateBaseSelect) // Use the base select string
    .eq("id", id)
    .single();

  if (error) {
    console.error(`[pathway-template-service] getPathwayTemplateById(${id}) - Error fetching template:`, error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  // Extract user IDs
  const userIds = new Set<string>();
  if (data.creator_user?.id) userIds.add(data.creator_user.id);
  if (data.last_updater_user?.id) userIds.add(data.last_updater_user.id);

  let profilesMap = new Map<string, Profile>();
  if (userIds.size > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", Array.from(userIds));

    if (profilesError) {
      console.error(`[pathway-template-service] getPathwayTemplateById(${id}) - Error fetching profiles:`, profilesError.message);
    } else if (profilesData) {
      profilesData.forEach(p => profilesMap.set(p.id, p as Profile));
    }
  }

  // Manually merge profile data
  const creatorProfile = data.creator_user?.id ? profilesMap.get(data.creator_user.id) : null;
  const lastUpdaterProfile = data.last_updater_user?.id ? profilesMap.get(data.last_updater_user.id) : null;

  const enrichedData = {
    ...data,
    creator_profile: creatorProfile ? { ...creatorProfile, email: data.creator_user.email } : null,
    last_updater_profile: lastUpdaterProfile ? { ...lastUpdaterProfile, email: data.last_updater_user.email } : null,
  } as PathwayTemplate;

  console.log(`[pathway-template-service] getPathwayTemplateById(${id}) - Fetched and enriched data:`, enrichedData);
  return enrichedData;
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
  console.log("[pathway-template-service] createPathwayTemplate - Attempting insert with:", { name, description, is_private, creator_id, status, last_updated_by, application_open_date, participation_deadline, general_instructions, is_visible_to_applicants, tags });
  
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
    .select(pathwayTemplateBaseSelect) // Use the base select string for return
    .single();

  if (error) {
    console.error("[pathway-template-service] createPathwayTemplate - Error inserting template:", error.message);
    throw error; // Throw the error so the calling action can catch it
  }

  // Manually enrich the newly created template with profile data
  const newTemplateData = data as any;
  const userIds = new Set<string>();
  if (newTemplateData.creator_user?.id) userIds.add(newTemplateData.creator_user.id);
  if (newTemplateData.last_updater_user?.id) userIds.add(newTemplateData.last_updater_user.id);

  let profilesMap = new Map<string, Profile>();
  if (userIds.size > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", Array.from(userIds));

    if (profilesError) {
      console.error("[pathway-template-service] createPathwayTemplate - Error fetching profiles for new template:", profilesError.message);
    } else if (profilesData) {
      profilesData.forEach(p => profilesMap.set(p.id, p as Profile));
    }
  }

  const creatorProfile = newTemplateData.creator_user?.id ? profilesMap.get(newTemplateData.creator_user.id) : null;
  const lastUpdaterProfile = newTemplateData.last_updater_user?.id ? profilesMap.get(newTemplateData.last_updater_user.id) : null;

  const enrichedNewTemplate = {
    ...newTemplateData,
    creator_profile: creatorProfile ? { ...creatorProfile, email: newTemplateData.creator_user.email } : null,
    last_updater_profile: lastUpdaterProfile ? { ...lastUpdaterProfile, email: newTemplateData.last_updater_user.email } : null,
  } as PathwayTemplate;

  console.log("[pathway-template-service] createPathwayTemplate - Insert successful, enriched data:", enrichedNewTemplate);
  return enrichedNewTemplate;
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
    .select(pathwayTemplateBaseSelect) // Use the base select string for return
    .single();

  if (error) {
    console.error(`[pathway-template-service] updatePathwayTemplate(${id}) - Error updating template:`, error.message);
    return null;
  }

  // Manually enrich the updated template with profile data
  const updatedTemplateData = data as any;
  const userIds = new Set<string>();
  if (updatedTemplateData.creator_user?.id) userIds.add(updatedTemplateData.creator_user.id);
  if (updatedTemplateData.last_updater_user?.id) userIds.add(updatedTemplateData.last_updater_user.id);

  let profilesMap = new Map<string, Profile>();
  if (userIds.size > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", Array.from(userIds));

    if (profilesError) {
      console.error("[pathway-template-service] updatePathwayTemplate - Error fetching profiles for updated template:", profilesError.message);
    } else if (profilesData) {
      profilesData.forEach(p => profilesMap.set(p.id, p as Profile));
    }
  }

  const creatorProfile = updatedTemplateData.creator_user?.id ? profilesMap.get(updatedTemplateData.creator_user.id) : null;
  const lastUpdaterProfile = updatedTemplateData.last_updater_user?.id ? profilesMap.get(updatedTemplateData.last_updater_user.id) : null;

  const enrichedUpdatedTemplate = {
    ...updatedTemplateData,
    creator_profile: creatorProfile ? { ...creatorProfile, email: updatedTemplateData.creator_user.email } : null,
    last_updater_profile: lastUpdaterProfile ? { ...lastUpdaterProfile, email: updatedTemplateData.last_updater_user.email } : null,
  } as PathwayTemplate;

  console.log(`[pathway-template-service] updatePathwayTemplate(${id}) - Update successful, enriched data:`, enrichedUpdatedTemplate);
  return enrichedUpdatedTemplate;
}

export async function deletePathwayTemplate(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("pathway_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`[pathway-template-service] deletePathwayTemplate(${id}) - Error deleting template:`, error.message);
    return false;
  }
  console.log(`[pathway-template-service] deletePathwayTemplate(${id}) - Delete successful.`);
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
    );
    return null;
  }
  console.log(`[pathway-template-service] getPhasesByPathwayTemplateId(${pathwayTemplateId}) - Fetched data:`, data);
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
    console.error("[pathway-template-service] createPhase - Error creating phase:", error.message);
    return null;
  }
  console.log("[pathway-template-service] createPhase - Insert successful, data:", data);
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
    console.error(`[pathway-template-service] updatePhase(${id}) - Error updating phase:`, error.message);
    return null;
  }
  console.log(`[pathway-template-service] updatePhase(${id}) - Update successful, data:`, data);
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
    console.error(`[pathway-template-service] updatePhaseBranchingConfig(${id}) - Error fetching phase for config update:`, fetchError?.message);
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
    console.error(`[pathway-template-service] updatePhaseBranchingConfig(${id}) - Error updating phase branching config:`, error.message);
    return null;
  }
  console.log(`[pathway-template-service] updatePhaseBranchingConfig(${id}) - Update successful, data:`, data);
  return data;
}

export async function deletePhase(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase.from("phases").delete().eq("id", id);

  if (error) {
    console.error(`[pathway-template-service] deletePhase(${id}) - Error deleting phase:`, error.message);
    return false;
  }
  console.log(`[pathway-template-service] deletePhase(${id}) - Delete successful.`);
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
    console.error("[pathway-template-service] clonePathwayTemplate - Error fetching original template for cloning:", templateError?.message);
    return null;
  }

  const { data: originalPhases, error: phasesError } = await supabase
    .from("phases")
    .select("*")
    .eq("pathway_template_id", templateId)
    .order("order_index", { ascending: true });

  if (phasesError) {
    console.error("[pathway-template-service] clonePathwayTemplate - Error fetching original phases for cloning:", phasesError.message);
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
    .select(pathwayTemplateBaseSelect) // Use the base select string for return
    .single();

  if (newTemplateError || !newTemplateData) {
    console.error("[pathway-template-service] clonePathwayTemplate - Error creating new template during cloning:", newTemplateError?.message);
    return null;
  }
  const newTemplate = newTemplateData as any; // Cast to any for intermediate processing

  // Manually enrich the newly created template with profile data
  const userIds = new Set<string>();
  if (newTemplate.creator_user?.id) userIds.add(newTemplate.creator_user.id);
  if (newTemplate.last_updater_user?.id) userIds.add(newTemplate.last_updater_user.id);

  let profilesMap = new Map<string, Profile>();
  if (userIds.size > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", Array.from(userIds));

    if (profilesError) {
      console.error("[pathway-template-service] clonePathwayTemplate - Error fetching profiles for new template:", profilesError.message);
    } else if (profilesData) {
      profilesData.forEach(p => profilesMap.set(p.id, p as Profile));
    }
  }

  const creatorProfile = newTemplate.creator_user?.id ? profilesMap.get(newTemplate.creator_user.id) : null;
  const lastUpdaterProfile = newTemplate.last_updater_user?.id ? profilesMap.get(newTemplate.last_updater_user.id) : null;

  const enrichedNewTemplate = {
    ...newTemplate,
    creator_profile: creatorProfile ? { ...creatorProfile, email: newTemplate.creator_user.email } : null,
    last_updater_profile: lastUpdaterProfile ? { ...lastUpdaterProfile, email: newTemplate.last_updater_user.email } : null,
  } as PathwayTemplate;

  console.log("[pathway-template-service] clonePathwayTemplate - New template created during cloning:", enrichedNewTemplate);

  // Create new phases for the cloned template
  const newPhasesData = originalPhases.map((phase) => ({
    pathway_template_id: enrichedNewTemplate.id, // Use the ID from the enriched new template
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
      console.error("[pathway-template-service] clonePathwayTemplate - Error creating new phases during cloning:", newPhasesError.message);
      // Optionally, delete the newly created template if phase creation fails
      await supabase.from("pathway_templates").delete().eq("id", enrichedNewTemplate.id);
      return null;
    }
    console.log("[pathway-template-service] clonePathwayTemplate - New phases created during cloning:", newPhasesData);
  }
  return enrichedNewTemplate;
}