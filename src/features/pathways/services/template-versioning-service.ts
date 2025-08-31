"use server";

import { createClient } from "@/integrations/supabase/server";
import { PathwayTemplate, Phase } from "@/types/supabase"; // Corrected import path for PathwayTemplate, Phase
import { getPathwayTemplateById, getPhasesByPathwayTemplateId, updatePathwayTemplate, updatePhase } from "./pathway-template-service";
import { Profile } from "@/types/supabase";

export interface PathwayTemplateVersion {
  id: string;
  pathway_template_id: string;
  version_number: number;
  snapshot: {
    template: PathwayTemplate;
    phases: Phase[];
  };
  created_by: string;
  created_at: string;
  profiles?: Profile; // For joining with creator's profile
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function createTemplateVersion(
  pathwayTemplateId: string,
  snapshot: PathwayTemplateVersion['snapshot'],
  createdBy: string
): Promise<PathwayTemplateVersion | null> {
  const supabase = await getSupabase();

  // Determine the next version number
  const { data: latestVersion, error: versionError } = await supabase
    .from("pathway_template_versions")
    .select("version_number")
    .eq("pathway_template_id", pathwayTemplateId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

  const { data, error } = await supabase
    .from("pathway_template_versions")
    .insert([{
      pathway_template_id: pathwayTemplateId,
      version_number: nextVersionNumber,
      snapshot: snapshot,
      created_by: createdBy,
    }])
    .select("*, profiles(first_name, last_name, avatar_url)")
    .single();

  if (error) {
    console.error("Error creating template version:", error.message);
    return null;
  }
  return data as PathwayTemplateVersion;
}

export async function getTemplateVersions(pathwayTemplateId: string): Promise<PathwayTemplateVersion[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_template_versions")
    .select("*, profiles(first_name, last_name, avatar_url)")
    .eq("pathway_template_id", pathwayTemplateId)
    .order("version_number", { ascending: false });

  if (error) {
    console.error(`Error fetching template versions for template ${pathwayTemplateId}:`, error.message);
    return null;
  }
  return data as PathwayTemplateVersion[];
}

export async function getTemplateVersion(versionId: string): Promise<PathwayTemplateVersion | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("pathway_template_versions")
    .select("*, profiles(first_name, last_name, avatar_url)")
    .eq("id", versionId)
    .single();

  if (error) {
    console.error(`Error fetching template version ${versionId}:`, error.message);
    return null;
  }
  return data as PathwayTemplateVersion;
}

export async function rollbackTemplateToVersion(
  pathwayTemplateId: string,
  versionId: string,
  updaterId: string // Added updaterId
): Promise<PathwayTemplate | null> {
  const supabase = await getSupabase();

  const { data: version, error: versionError } = await supabase
    .from("pathway_template_versions")
    .select("snapshot")
    .eq("id", versionId)
    .single();

  if (versionError || !version?.snapshot) {
    console.error(`Error fetching snapshot for version ${versionId}:`, versionError?.message);
    throw new Error("Failed to retrieve template version snapshot.");
  }

  const { template: snapshotTemplate, phases: snapshotPhases } = version.snapshot;

  // Start a transaction (conceptual, Supabase doesn't have explicit transactions for RPC/multiple inserts)
  // For critical operations, consider a Supabase Edge Function or a more robust transaction management.

  // 1. Update the main pathway_template
  const updatedTemplate = await updatePathwayTemplate(
    pathwayTemplateId,
    {
      name: snapshotTemplate.name,
      description: snapshotTemplate.description,
      is_private: snapshotTemplate.is_private,
      status: snapshotTemplate.status, // Include status in rollback
      application_open_date: snapshotTemplate.application_open_date,
      participation_deadline: snapshotTemplate.participation_deadline,
      general_instructions: snapshotTemplate.general_instructions,
      applicant_instructions: snapshotTemplate.applicant_instructions,
      manager_instructions: snapshotTemplate.manager_instructions,
      is_visible_to_applicants: snapshotTemplate.is_visible_to_applicants,
    },
    updaterId // Pass updaterId
  );

  if (!updatedTemplate) {
    console.error("Error updating main template during rollback.");
    throw new Error("Failed to rollback main template.");
  }

  // 2. Delete all existing phases for the template
  const { error: deletePhasesError } = await supabase
    .from("phases")
    .delete()
    .eq("pathway_template_id", pathwayTemplateId);

  if (deletePhasesError) {
    console.error("Error deleting existing phases during rollback:", deletePhasesError.message);
    throw new Error("Failed to clear existing phases for rollback.");
  }

  // 3. Insert phases from the snapshot
  if (snapshotPhases && snapshotPhases.length > 0) {
    const phasesToInsert = snapshotPhases.map((phase: Phase) => ({
      pathway_template_id: pathwayTemplateId,
      name: phase.name,
      type: phase.type,
      description: phase.description,
      order_index: phase.order_index,
      config: phase.config,
      last_updated_by: updaterId, // Set updaterId for restored phases
      phase_start_date: phase.phase_start_date,
      phase_end_date: phase.phase_end_date,
      applicant_instructions: phase.applicant_instructions,
      manager_instructions: phase.manager_instructions,
      is_visible_to_applicants: phase.is_visible_to_applicants,
    }));

    const { error: insertPhasesError } = await supabase
      .from("phases")
      .insert(phasesToInsert);

    if (insertPhasesError) {
      console.error("Error inserting snapshot phases during rollback:", insertPhasesError.message);
      throw new Error("Failed to restore phases from snapshot.");
    }
  }

  return updatedTemplate;
}