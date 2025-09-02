"use server";

import {
  PathwayTemplate, // Corrected import path
  Phase, // Corrected import path
  PhaseTask, // Corrected import path
} from "@/types/supabase"; // All types now imported from central types file
import {
  getPathwayTemplates,
  getPathwayTemplateById,
  createPathwayTemplate,
  updatePathwayTemplate as updatePathwayTemplateService,
  deletePathwayTemplate,
  getPhasesByPathwayTemplateId,
  createPhase,
  updatePhase as updatePhaseService,
  updatePhaseBranchingConfig as updatePhaseBranchingConfigService,
  deletePhase,
  clonePathwayTemplate,
} from "./services/pathway-template-service";
import {
  getPhaseTasksByPhaseId,
  createPhaseTask,
  updatePhaseTask,
  deletePhaseTask,
} from "./services/phase-task-service";
import {
  PathwayTemplateVersion,
  createTemplateVersion,
  getTemplateVersions,
  getTemplateVersion,
  rollbackTemplateToVersion,
} from "./services/template-versioning-service";
import { createActivityLog } from "./services/template-activity-log-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper function to check user authorization for a template
async function authorizeTemplateAction(templateId: string | null, action: 'read' | 'write' | 'version' | 'admin_only'): Promise<{ user: any; template: PathwayTemplate | null; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[pathways/actions] authorizeTemplateAction - User not authenticated:", userError?.message); // LOG ADDED
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let template: PathwayTemplate | null = null;
  if (templateId) {
    try {
      template = await getPathwayTemplateById(templateId);
    } catch (serviceError: any) {
      console.error(`[pathways/actions] authorizeTemplateAction(${templateId}, ${action}) - Error fetching template:`, serviceError.message); // LOG ADDED
      throw new Error("TemplateNotFound");
    }
    if (!template) {
      console.error(`[pathways/actions] authorizeTemplateAction(${templateId}, ${action}) - Template not found.`); // LOG ADDED
      throw new Error("TemplateNotFound");
    }
  }

  if (action === 'admin_only') {
    if (!isAdmin) {
      console.warn(`[pathways/actions] authorizeTemplateAction(${templateId}, ${action}) - Unauthorized: Not admin.`); // LOG ADDED
      throw new Error("UnauthorizedAccessAdminOnly");
    }
  } else if (action === 'read') {
    if (!isAdmin && template && template.is_private && template.creator_id !== user.id && template.status !== 'published') {
      console.warn(`[pathways/actions] authorizeTemplateAction(${templateId}, ${action}) - Unauthorized: Private template, not creator, not published, not admin.`); // LOG ADDED
      throw new Error("UnauthorizedAccessToPrivateTemplate");
    }
  } else if (action === 'write' || action === 'version') {
    if (!isAdmin && template && template.creator_id !== user.id) {
      console.warn(`[pathways/actions] authorizeTemplateAction(${templateId}, ${action}) - Unauthorized: Not creator, not admin.`); // LOG ADDED
      throw new Error("UnauthorizedToModifyTemplate");
    }
  }
  console.log(`[pathways/actions] authorizeTemplateAction(${templateId}, ${action}) - Authorization successful. User: ${user.id}, Role: ${userRole}`); // LOG ADDED
  return { user, template, isAdmin };
}

export async function getTemplatesAction(): Promise<PathwayTemplate[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[pathways/actions] getTemplatesAction - User not authenticated:", userError?.message); // LOG ADDED
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  const data = await getPathwayTemplates();
  console.log("[pathways/actions] getTemplatesAction - Raw data from service:", data); // LOG ADDED

  if (!data) {
    console.warn("[pathways/actions] getTemplatesAction - No data returned from getPathwayTemplates."); // LOG ADDED
    return null;
  }

  const filteredData = data.filter(template => isAdmin || template.creator_id === user.id || (!template.is_private && template.status === 'published'));
  console.log("[pathways/actions] getTemplatesAction - Filtered data:", filteredData); // LOG ADDED
  return filteredData;
}

export async function getTemplateByIdAction(id: string): Promise<PathwayTemplate | null> {
  try {
    const { template } = await authorizeTemplateAction(id, 'read');
    return template;
  } catch (error: any) {
    console.error("[pathways/actions] getTemplateByIdAction - Error:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedAccessToPrivateTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    redirect("/login");
  }
}

export async function createPathwayTemplateAction(formData: FormData): Promise<PathwayTemplate | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[pathways/actions] createPathwayTemplateAction - User not authenticated:", userError?.message); // LOG ADDED
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const is_private = formData.get("is_private") === "on";
  const application_open_date = (formData.get("application_open_date") as string) || null;
  const participation_deadline = (formData.get("participation_deadline") as string) || null;
  const general_instructions = (formData.get("general_instructions") as string) || null;
  const is_visible_to_applicants = formData.get("is_visible_to_applicants") === "on";
  const tagsString = (formData.get("tags") as string);
  const tags = tagsString ? JSON.parse(tagsString) : null;

  console.log("[pathways/actions] createPathwayTemplateAction - Form data parsed:", { name, description, is_private, application_open_date, participation_deadline, general_instructions, is_visible_to_applicants, tags, userId: user.id }); // LOG ADDED

  if (!name) {
    console.error("[pathways/actions] createPathwayTemplateAction - Validation error: Template name is required."); // LOG ADDED
    throw new Error("Template name is required.");
  }

  try {
    const newTemplate = await createPathwayTemplate(
      name,
      description,
      is_private,
      user.id,
      'draft', // New templates start as draft
      user.id, // Set last_updated_by
      application_open_date,
      participation_deadline,
      general_instructions,
      is_visible_to_applicants,
      tags // Pass the new tags argument
    );

    if (newTemplate) {
      await createActivityLog(newTemplate.id, user.id, 'created', `Created pathway template "${newTemplate.name}".`);
      console.log("[pathways/actions] createPathwayTemplateAction - Template created and activity logged:", newTemplate); // LOG ADDED
    } else {
      console.error("[pathways/actions] createPathwayTemplateAction - createPathwayTemplate returned null."); // LOG ADDED
    }

    revalidatePath("/pathways");
    return newTemplate;
  } catch (error: any) {
    console.error("[pathways/actions] createPathwayTemplateAction - Error during creation:", error); // Log the full error object
    throw error;
  }
}

export async function updatePathwayTemplateAction(id: string, formData: FormData): Promise<PathwayTemplate | null> {
  try {
    const { user, template } = await authorizeTemplateAction(id, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const is_private = formData.get("is_private") === "on";
    const application_open_date = (formData.get("application_open_date") as string) || null;
    const participation_deadline = (formData.get("participation_deadline") as string) || null;
    const general_instructions = (formData.get("general_instructions") as string) || null;
    const is_visible_to_applicants = formData.get("is_visible_to_applicants") === "on";
    const tagsString = (formData.get("tags") as string);
    const tags = tagsString ? JSON.parse(tagsString) : null;

    console.log("[pathways/actions] updatePathwayTemplateAction - Form data parsed:", { id, name, description, is_private, application_open_date, participation_deadline, general_instructions, is_visible_to_applicants, tags, userId: user.id }); // LOG ADDED

    if (!name) {
      console.error("[pathways/actions] updatePathwayTemplateAction - Validation error: Template name is required."); // LOG ADDED
      throw new Error("Template name is required.");
    }

    const oldValues = {
      name: template.name,
      description: template.description,
      is_private: template.is_private,
      application_open_date: template.application_open_date,
      participation_deadline: template.participation_deadline,
      general_instructions: template.general_instructions,
      is_visible_to_applicants: template.is_visible_to_applicants,
      tags: template.tags,
    };
    const newValues = {
      name,
      description,
      is_private,
      application_open_date,
      participation_deadline,
      general_instructions,
      is_visible_to_applicants,
      tags,
    };

    const updatedTemplate = await updatePathwayTemplateService(
      id,
      {
        name,
        description,
        is_private,
        application_open_date,
        participation_deadline,
        general_instructions,
        is_visible_to_applicants,
        tags,
      },
      user.id
    );

    if (updatedTemplate) {
      await createActivityLog(id, user.id, 'updated', `Updated pathway template "${updatedTemplate.name}".`, { oldValues, newValues });
      console.log("[pathways/actions] updatePathwayTemplateAction - Template updated and activity logged:", updatedTemplate); // LOG ADDED
    } else {
      console.error("[pathways/actions] updatePathwayTemplateAction - updatePathwayTemplateService returned null."); // LOG ADDED
    }

    revalidatePath("/pathways");
    revalidatePath(`/pathways/${id}`);
    return updatedTemplate;
  } catch (error: any) {
    console.error("[pathways/actions] updatePathwayTemplateAction - Error during update:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    throw error;
  }
}

export async function deletePathwayTemplateAction(id: string): Promise<boolean> {
  try {
    const { user, template } = await authorizeTemplateAction(id, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const success = await deletePathwayTemplate(id);

    if (success) {
      await createActivityLog(id, user.id, 'deleted', `Deleted pathway template "${template.name}".`);
      console.log("[pathways/actions] deletePathwayTemplateAction - Template deleted and activity logged."); // LOG ADDED
    } else {
      console.error("[pathways/actions] deletePathwayTemplateAction - deletePathwayTemplate returned false."); // LOG ADDED
    }

    revalidatePath("/pathways");
    return success;
  } catch (error: any) {
    console.error("[pathways/actions] deletePathwayTemplateAction - Error during deletion:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}

export async function updatePathwayTemplateStatusAction(id: string, newStatus: PathwayTemplate['status']): Promise<PathwayTemplate | null> {
  try {
    const { user, template } = await authorizeTemplateAction(id, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const oldStatus = template.status;
    const updatedTemplate = await updatePathwayTemplateService(
      id,
      { status: newStatus },
      user.id
    );

    if (updatedTemplate) {
      await createActivityLog(id, user.id, 'status_updated', `Updated status of "${updatedTemplate.name}" from "${oldStatus}" to "${newStatus}".`, { oldStatus, newStatus });
      console.log("[pathways/actions] updatePathwayTemplateStatusAction - Template status updated and activity logged:", updatedTemplate); // LOG ADDED
    } else {
      console.error("[pathways/actions] updatePathwayTemplateStatusAction - updatePathwayTemplateService returned null."); // LOG ADDED
    }

    revalidatePath("/pathways");
    revalidatePath(`/pathways/${id}`);
    return updatedTemplate;
  }
  catch (error: any) {
    console.error("[pathways/actions] updatePathwayTemplateStatusAction - Error during status update:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}

export async function publishPathwayTemplateAction(id: string): Promise<PathwayTemplateVersion | null> {
  try {
    const { user, template } = await authorizeTemplateAction(id, 'version');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    // First, update the template status to 'published'
    const updatedTemplate = await updatePathwayTemplateService(id, { status: 'published' }, user.id);
    if (!updatedTemplate) {
      console.error("[pathways/actions] publishPathwayTemplateAction - Failed to update template status to published."); // LOG ADDED
      throw new Error("Failed to update template status to published.");
    }

    // Then, create a new version snapshot
    const phases = await getPhasesByPathwayTemplateId(id);
    const snapshot = { template, phases: phases || [] };

    const newVersion = await createTemplateVersion(id, snapshot, user.id);

    if (newVersion) {
      await createActivityLog(id, user.id, 'published', `Published new version ${newVersion.version_number} of template "${template.name}".`);
      console.log("[pathways/actions] publishPathwayTemplateAction - Template published and new version created:", newVersion); // LOG ADDED
    } else {
      console.error("[pathways/actions] publishPathwayTemplateAction - createTemplateVersion returned null."); // LOG ADDED
    }

    revalidatePath("/pathways");
    revalidatePath(`/pathways/${id}`);
    return newVersion;
  } catch (error: any) {
    console.error("[pathways/actions] publishPathwayTemplateAction - Error during publish:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}

// --- Phase Management Server Actions ---

export async function getPhasesAction(pathwayTemplateId: string): Promise<Phase[] | null> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'read');
    const phases = await getPhasesByPathwayTemplateId(pathwayTemplateId);
    console.log(`[pathways/actions] getPhasesAction(${pathwayTemplateId}) - Fetched phases:`, phases); // LOG ADDED
    return phases;
  } catch (error: any) {
    console.error("[pathways/actions] getPhasesAction - Error:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedAccessToPrivateTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound" || error.message === "PhaseNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    redirect("/login");
  }
}

export async function createPhaseAction(pathwayTemplateId: string, formData: FormData): Promise<Phase | null> {
  try {
    const { user, template } = await authorizeTemplateAction(pathwayTemplateId, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = (formData.get("description") as string) || null;
    const order_index = parseInt(formData.get("order_index") as string);
    const phase_start_date = (formData.get("phase_start_date") as string) || null;
    const phase_end_date = (formData.get("phase_end_date") as string) || null;
    const applicant_instructions = (formData.get("applicant_instructions") as string) || null;
    const manager_instructions = (formData.get("manager_instructions") as string) || null;
    const is_visible_to_applicants = formData.get("is_visible_to_applicants") === "on";

    console.log("[pathways/actions] createPhaseAction - Form data parsed:", { pathwayTemplateId, name, type, description, order_index, phase_start_date, phase_end_date, applicant_instructions, manager_instructions, is_visible_to_applicants, userId: user.id }); // LOG ADDED

    if (!name || !type || isNaN(order_index)) {
      console.error("[pathways/actions] createPhaseAction - Validation error: Name, type, or order index missing/invalid."); // LOG ADDED
      throw new Error("Phase name, type, and order index are required.");
    }

    const newPhase = await createPhase(
      pathwayTemplateId,
      name,
      type,
      order_index,
      description,
      {}, // Initial empty config
      user.id, // Pass creatorId for last_updated_by
      phase_start_date,
      phase_end_date,
      applicant_instructions,
      manager_instructions,
      is_visible_to_applicants
    );

    if (newPhase) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_added', `Added phase "${newPhase.name}" (${newPhase.type}) to template "${template.name}".`, { phaseId: newPhase.id });
      console.log("[pathways/actions] createPhaseAction - Phase created and activity logged:", newPhase); // LOG ADDED
    } else {
      console.error("[pathways/actions] createPhaseAction - createPhase returned null."); // LOG ADDED
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return newPhase;
  } catch (error: any) {
    console.error("[pathways/actions] createPhaseAction - Error during creation:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    throw error;
  }
}

export async function updatePhaseAction(phaseId: string, pathwayTemplateId: string, formData: FormData): Promise<Phase | null> {
  try {
    const { user, template } = await authorizeTemplateAction(pathwayTemplateId, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = (formData.get("description") as string) || null;
    const phase_start_date = (formData.get("phase_start_date") as string) || null;
    const phase_end_date = (formData.get("phase_end_date") as string) || null;
    const applicant_instructions = (formData.get("applicant_instructions") as string) || null;
    const manager_instructions = (formData.get("manager_instructions") as string) || null;
    const is_visible_to_applicants = formData.get("is_visible_to_applicants") === "on";

    console.log("[pathways/actions] updatePhaseAction - Form data parsed:", { phaseId, pathwayTemplateId, name, type, description, phase_start_date, phase_end_date, applicant_instructions, manager_instructions, is_visible_to_applicants, userId: user.id }); // LOG ADDED

    if (!name || !type) {
      console.error("[pathways/actions] updatePhaseAction - Validation error: Name or type missing."); // LOG ADDED
      throw new Error("Phase name and type are required.");
    }

    const updatedPhase = await updatePhaseService(
      phaseId,
      {
        name,
        type,
        description,
        phase_start_date,
        phase_end_date,
        applicant_instructions,
        manager_instructions,
        is_visible_to_applicants,
      },
      user.id
    );

    if (updatedPhase) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_updated', `Updated phase "${updatedPhase.name}" (${updatedPhase.type}) in template "${template.name}".`, { phaseId: updatedPhase.id });
      console.log("[pathways/actions] updatePhaseAction - Phase updated and activity logged:", updatedPhase); // LOG ADDED
    } else {
      console.error("[pathways/actions] updatePhaseAction - updatePhaseService returned null."); // LOG ADDED
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("[pathways/actions] updatePhaseAction - Error during update:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    throw error;
  }
}

export async function updatePhaseConfigAction(phaseId: string, pathwayTemplateId: string, configUpdates: Record<string, any>): Promise<Phase | null> {
  try {
    const { user, template } = await authorizeTemplateAction(pathwayTemplateId, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    console.log("[pathways/actions] updatePhaseConfigAction - Config updates received:", { phaseId, pathwayTemplateId, configUpdates, userId: user.id }); // LOG ADDED

    const updatedPhase = await updatePhaseService(
      phaseId,
      { config: configUpdates },
      user.id
    );

    if (updatedPhase) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_config_updated', `Updated configuration for phase "${updatedPhase.name}" in template "${template.name}".`, { phaseId: updatedPhase.id, configUpdates });
      console.log("[pathways/actions] updatePhaseConfigAction - Phase config updated and activity logged:", updatedPhase); // LOG ADDED
    } else {
      console.error("[pathways/actions] updatePhaseConfigAction - updatePhaseService returned null."); // LOG ADDED
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("[pathways/actions] updatePhaseConfigAction - Error during config update:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    throw error;
  }
}

export async function updatePhaseBranchingAction(phaseId: string, pathwayTemplateId: string, formData: FormData): Promise<Phase | null> {
  try {
    const { user, template } = await authorizeTemplateAction(pathwayTemplateId, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const next_phase_id_on_success = (formData.get("next_phase_id_on_success") as string) || null;
    const next_phase_id_on_failure = (formData.get("next_phase_id_on_failure") as string) || null;

    console.log("[pathways/actions] updatePhaseBranchingAction - Form data parsed:", { phaseId, pathwayTemplateId, next_phase_id_on_success, next_phase_id_on_failure, userId: user.id }); // LOG ADDED

    // Basic validation: Ensure selected phases exist within the same template
    const allPhases = await getPhasesByPathwayTemplateId(pathwayTemplateId);
    if (next_phase_id_on_success && !allPhases?.some(p => p.id === next_phase_id_on_success)) {
      console.error("[pathways/actions] updatePhaseBranchingAction - Validation error: Selected success phase does not exist."); // LOG ADDED
      throw new Error("Selected success phase does not exist in this template.");
    }
    if (next_phase_id_on_failure && !allPhases?.some(p => p.id === next_phase_id_on_failure)) {
      console.error("[pathways/actions] updatePhaseBranchingAction - Validation error: Selected failure phase does not exist."); // LOG ADDED
      throw new Error("Selected failure phase does not exist in this template.");
    }

    const configUpdates = {
      next_phase_id_on_success: next_phase_id_on_success || null,
      next_phase_id_on_failure: next_phase_id_on_failure || null,
    };

    const updatedPhase = await updatePhaseBranchingConfigService(phaseId, configUpdates, user.id);

    if (updatedPhase) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_branching_updated', `Updated branching for phase "${updatedPhase.name}" in template "${template.name}".`, { phaseId: updatedPhase.id, configUpdates });
      console.log("[pathways/actions] updatePhaseBranchingAction - Phase branching updated and activity logged:", updatedPhase); // LOG ADDED
    } else {
      console.error("[pathways/actions] updatePhaseBranchingAction - updatePhaseBranchingConfigService returned null."); // LOG ADDED
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("[pathways/actions] updatePhaseBranchingAction - Error during branching update:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    throw error;
  }
}

export async function deletePhaseAction(phaseId: string, pathwayTemplateId: string): Promise<boolean> {
  try {
    const { user, template } = await authorizeTemplateAction(pathwayTemplateId, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const success = await deletePhase(phaseId);

    if (success) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_deleted', `Deleted phase "${phaseId}" from template "${template?.name}".`, { phaseId });
      console.log("[pathways/actions] deletePhaseAction - Phase deleted and activity logged."); // LOG ADDED
    } else {
      console.error("[pathways/actions] deletePhaseAction - deletePhase returned false."); // LOG ADDED
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return success;
  } catch (error: any) {
    console.error("[pathways/actions] deletePhaseAction - Error during deletion:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}

export async function reorderPhasesAction(pathwayTemplateId: string, phases: { id: string; order_index: number }[]): Promise<boolean> {
  try {
    const { user, template } = await authorizeTemplateAction(pathwayTemplateId, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    console.log("[pathways/actions] reorderPhasesAction - Reordering phases:", phases); // LOG ADDED
    for (const phase of phases) {
      await updatePhaseService(phase.id, { order_index: phase.order_index }, user.id);
    }

    await createActivityLog(pathwayTemplateId, user.id, 'phases_reordered', `Reordered phases in template "${template.name}".`, { newOrder: phases.map(p => ({ id: p.id, order_index: p.order_index })) });
    console.log("[pathways/actions] reorderPhasesAction - Phases reordered and activity logged."); // LOG ADDED

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return true;
  } catch (error: any) {
    console.error("[pathways/actions] reorderPhasesAction - Error during reorder:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    throw error;
  }
}

// --- Template Cloning Server Action ---
export async function clonePathwayTemplateAction(templateId: string, newName: string): Promise<PathwayTemplate | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[pathways/actions] clonePathwayTemplateAction - User not authenticated:", userError?.message); // LOG ADDED
    redirect("/login");
  }

  try {
    const { template } = await authorizeTemplateAction(templateId, 'read');
    if (!template) {
      throw new Error("TemplateNotFound");
    }
  } catch (error: any) {
    console.error("[pathways/actions] clonePathwayTemplateAction authorization - Error:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedAccessToPrivateTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    redirect("/login");
  }

  if (!newName) {
    console.error("[pathways/actions] clonePathwayTemplateAction - Validation error: New template name is required."); // LOG ADDED
    throw new Error("New template name is required.");
  }

  try {
    const clonedTemplate = await clonePathwayTemplate(
      templateId,
      newName,
      user.id,
      user.id
    );
    if (clonedTemplate) {
      await createActivityLog(clonedTemplate.id, user.id, 'cloned', `Cloned template "${templateId}" to new template "${clonedTemplate.name}".`, { originalTemplateId: templateId });
      console.log("[pathways/actions] clonePathwayTemplateAction - Template cloned and activity logged:", clonedTemplate); // LOG ADDED
    } else {
      console.error("[pathways/actions] clonePathwayTemplateAction - clonePathwayTemplate returned null."); // LOG ADDED
    }
    revalidatePath("/pathways");
    return clonedTemplate;
  } catch (error: any) {
    console.error("[pathways/actions] clonePathwayTemplateAction - Error during cloning:", error.message); // LOG ADDED
    throw error;
  }
}

// --- Template Versioning Server Actions ---

export async function createTemplateVersionAction(pathwayTemplateId: string): Promise<PathwayTemplateVersion | null> {
  try {
    const { user, template } = await authorizeTemplateAction(pathwayTemplateId, 'version');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const phases = await getPhasesByPathwayTemplateId(pathwayTemplateId);
    const snapshot = { template, phases: phases || [] };

    const newVersion = await createTemplateVersion(pathwayTemplateId, snapshot, user.id);

    if (newVersion) {
      await createActivityLog(pathwayTemplateId, user.id, 'version_created', `Created new version ${newVersion.version_number} for template "${template.name}".`);
      console.log("[pathways/actions] createTemplateVersionAction - New version created and activity logged:", newVersion); // LOG ADDED
    } else {
      console.error("[pathways/actions] createTemplateVersionAction - createTemplateVersion returned null."); // LOG ADDED
    }

    revalidatePath("/pathways");
    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return newVersion;
  } catch (error: any) {
    console.error("[pathways/actions] createTemplateVersionAction - Error during version creation:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}

export async function getTemplateVersionsAction(pathwayTemplateId: string): Promise<PathwayTemplateVersion[] | null> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'read');
    const versions = await getTemplateVersions(pathwayTemplateId);
    console.log(`[pathways/actions] getTemplateVersionsAction(${pathwayTemplateId}) - Fetched versions:`, versions); // LOG ADDED
    return versions;
  } catch (error: any) {
    console.error("[pathways/actions] getTemplateVersionsAction - Error:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedAccessToPrivateTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}

export async function getTemplateVersionAction(versionId: string): Promise<PathwayTemplateVersion | null> {
  try {
    const version = await getTemplateVersion(versionId);
    if (!version) {
      console.error("[pathways/actions] getTemplateVersionAction - Template version not found."); // LOG ADDED
      throw new Error("TemplateVersionNotFound");
    }
    await authorizeTemplateAction(version.pathway_template_id, 'read');
    console.log(`[pathways/actions] getTemplateVersionAction(${versionId}) - Fetched version:`, version); // LOG ADDED
    return version;
  } catch (error: any) {
    console.error("[pathways/actions] getTemplateVersionAction - Error:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedAccessToPrivateTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateVersionNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}

export async function rollbackTemplateToVersionAction(pathwayTemplateId: string, versionId: string): Promise<PathwayTemplate | null> {
  try {
    const { user, template } = await authorizeTemplateAction(pathwayTemplateId, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    console.log("[pathways/actions] rollbackTemplateToVersionAction - Attempting rollback:", { pathwayTemplateId, versionId, userId: user.id }); // LOG ADDED
    const rolledBackTemplate = await rollbackTemplateToVersion(pathwayTemplateId, versionId, user.id);

    if (rolledBackTemplate) {
      await createActivityLog(pathwayTemplateId, user.id, 'rolled_back', `Rolled back template "${template.name}" to version "${versionId}".`, { versionId });
      console.log("[pathways/actions] rollbackTemplateToVersionAction - Template rolled back and activity logged:", rolledBackTemplate); // LOG ADDED
    } else {
      console.error("[pathways/actions] rollbackTemplateToVersionAction - rollbackTemplateToVersion returned null."); // LOG ADDED
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return rolledBackTemplate;
  } catch (error: any) {
    console.error("[pathways/actions] rollbackTemplateToVersionAction - Error during rollback:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound" || error.message === "TemplateVersionNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}

// --- Phase Task Management Server Actions ---

// Helper function to authorize access to a phase task
async function authorizePhaseTaskAction(taskId: string | null, phaseId: string, pathwayTemplateId: string, action: 'read' | 'write' | 'update_status'): Promise<{ user: any; task: PhaseTask | null; isAdmin: boolean; isPhaseCreator: boolean; isAssignedUser: boolean; template: PathwayTemplate | null }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[pathways/actions] authorizePhaseTaskAction - User not authenticated:", userError?.message); // LOG ADDED
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  // Authorize access to the parent phase's template using the provided pathwayTemplateId
  await authorizeTemplateAction(pathwayTemplateId, 'read');
  const { template } = await authorizeTemplateAction(pathwayTemplateId, 'read'); // Re-fetch template with full auth
  if (!template) {
    console.error(`[pathways/actions] authorizePhaseTaskAction(${taskId}, ${phaseId}, ${pathwayTemplateId}, ${action}) - Parent template not found.`); // LOG ADDED
    throw new Error("ParentTemplateNotFound");
  }
  const isPhaseCreator = template.creator_id === user.id;

  let task: PhaseTask | null = null;
  if (taskId) {
    const tasks = await getPhaseTasksByPhaseId(phaseId);
    task = tasks?.find(t => t.id === taskId) || null;
    if (!task) {
      console.error(`[pathways/actions] authorizePhaseTaskAction(${taskId}, ${phaseId}, ${pathwayTemplateId}, ${action}) - Phase task not found.`); // LOG ADDED
      throw new Error("PhaseTaskNotFound");
    }
  }

  const isAssignedUser = task?.assigned_to_user_id === user.id;

  if (action === 'read') {
    // RLS on phase_tasks handles read access based on parent phase/template
  } else if (action === 'write') {
    if (!isAdmin && !isPhaseCreator) {
      console.warn(`[pathways/actions] authorizePhaseTaskAction(${taskId}, ${phaseId}, ${pathwayTemplateId}, ${action}) - Unauthorized to modify phase tasks.`); // LOG ADDED
      throw new Error("UnauthorizedToModifyPhaseTasks");
    }
  } else if (action === 'update_status') {
    if (!isAdmin && !isPhaseCreator && !isAssignedUser) {
      console.warn(`[pathways/actions] authorizePhaseTaskAction(${taskId}, ${phaseId}, ${pathwayTemplateId}, ${action}) - Unauthorized to update task status.`); // LOG ADDED
      throw new Error("UnauthorizedToUpdateTaskStatus");
    }
  }
  console.log(`[pathways/actions] authorizePhaseTaskAction(${taskId}, ${phaseId}, ${pathwayTemplateId}, ${action}) - Authorization successful. User: ${user.id}, Role: ${userRole}`); // LOG ADDED
  return { user, task, isAdmin, isPhaseCreator, isAssignedUser, template };
}

export async function getPhaseTasksAction(phaseId: string): Promise<PhaseTask[] | null> {
  try {
    // Authorize read access to the parent phase's template
    // We need the pathwayTemplateId to authorize, so we'll fetch the phase first
    const supabase = await createClient();
    const { data: phaseData, error: phaseError } = await supabase.from('phases').select('pathway_template_id').eq('id', phaseId).single();
    if (phaseError || !phaseData) {
      console.error(`[pathways/actions] getPhaseTasksAction(${phaseId}) - Phase not found:`, phaseError?.message); // LOG ADDED
      throw new Error("PhaseNotFound");
    }
    await authorizeTemplateAction(phaseData.pathway_template_id, 'read');
    const tasks = await getPhaseTasksByPhaseId(phaseId);
    console.log(`[pathways/actions] getPhaseTasksAction(${phaseId}) - Fetched tasks:`, tasks); // LOG ADDED
    return tasks;
  } catch (error: any) {
    console.error("[pathways/actions] getPhaseTasksAction - Error:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedAccessToPrivateTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound" || error.message === "PhaseNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    redirect("/login");
  }
}

export async function createPhaseTaskAction(phaseId: string, pathwayTemplateId: string, formData: FormData): Promise<PhaseTask | null> {
  try {
    const { user, template } = await authorizePhaseTaskAction(null, phaseId, pathwayTemplateId, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;
    const assigned_to_role = (formData.get("assigned_to_role") as string) || null;
    const assigned_to_user_id = (formData.get("assigned_to_user_id") as string) || null;
    const due_date_str = (formData.get("due_date") as string) || null;
    const order_index = parseInt(formData.get("order_index") as string);

    console.log("[pathways/actions] createPhaseTaskAction - Form data parsed:", { phaseId, pathwayTemplateId, name, description, assigned_to_role, assigned_to_user_id, due_date_str, order_index, userId: user.id }); // LOG ADDED

    if (!name || isNaN(order_index)) {
      console.error("[pathways/actions] createPhaseTaskAction - Validation error: Task name or order index missing/invalid."); // LOG ADDED
      throw new Error("Task name and order index are required.");
    }

    const newPhaseTask = await createPhaseTask(
      phaseId,
      name,
      description,
      assigned_to_role,
      assigned_to_user_id,
      due_date_str,
      order_index
    );

    if (newPhaseTask) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_task_added', `Added task "${newPhaseTask.name}" to phase "${phaseId}" in template "${template.name}".`, { phaseId, taskId: newPhaseTask.id });
      console.log("[pathways/actions] createPhaseTaskAction - Phase task created and activity logged:", newPhaseTask); // LOG ADDED
    } else {
      console.error("[pathways/actions] createPhaseTaskAction - createPhaseTask returned null."); // LOG ADDED
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return newPhaseTask;
  } catch (error: any) {
    console.error("[pathways/actions] createPhaseTaskAction - Error during creation:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyPhaseTasks") {
      redirect("/error/403");
    }
    throw error;
  }
}

export async function updatePhaseTaskAction(taskId: string, phaseId: string, pathwayTemplateId: string, formData: FormData): Promise<PhaseTask | null> {
  try {
    const { user, task, isAdmin, isPhaseCreator, isAssignedUser, template } = await authorizePhaseTaskAction(taskId, phaseId, pathwayTemplateId, 'write');
    if (!task) {
      throw new Error("PhaseTaskNotFound");
    }

    const updates: Partial<PhaseTask> = {};
    const name = (formData.get("name") as string) || undefined;
    const description = (formData.get("description") as string) || null;
    const assigned_to_role = (formData.get("assigned_to_role") as string) || null;
    const assigned_to_user_id = (formData.get("assigned_to_user_id") as string) || null;
    const due_date_str = (formData.get("due_date") as string) || null;
    const status = (formData.get("status") as PhaseTask['status']) || undefined;

    console.log("[pathways/actions] updatePhaseTaskAction - Form data parsed:", { taskId, phaseId, pathwayTemplateId, name, description, assigned_to_role, assigned_to_user_id, due_date_str, status, userId: user.id }); // LOG ADDED

    // Only allow status update by assigned user, creator, or admin
    if (status !== undefined) {
      const { user: statusUser, task: statusTask, isAdmin: statusIsAdmin, isPhaseCreator: statusIsPhaseCreator, isAssignedUser: statusIsAssignedUser } = await authorizePhaseTaskAction(taskId, phaseId, pathwayTemplateId, 'update_status');
      if (!statusIsAdmin && !statusIsPhaseCreator && !statusIsAssignedUser) {
        console.warn("[pathways/actions] updatePhaseTaskAction - Unauthorized to update task status."); // LOG ADDED
        throw new Error("UnauthorizedToUpdateTaskStatus");
      }
      updates.status = status;
    }

    // Other fields can only be updated by creator or admin
    if (name !== undefined && (isAdmin || isPhaseCreator)) updates.name = name;
    if (description !== undefined && (isAdmin || isPhaseCreator)) updates.description = description;
    if (assigned_to_role !== undefined && (isAdmin || isPhaseCreator)) updates.assigned_to_role = assigned_to_role;
    if (assigned_to_user_id !== undefined && (isAdmin || isPhaseCreator)) updates.assigned_to_user_id = assigned_to_user_id;
    if (due_date_str !== undefined && (isAdmin || isPhaseCreator)) updates.due_date = due_date_str;

    const updatedPhaseTask = await updatePhaseTask(taskId, updates);

    if (updatedPhaseTask) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_task_updated', `Updated task "${updatedPhaseTask.name}" in phase "${phaseId}" of template "${template?.name}".`, { phaseId, taskId: updatedPhaseTask.id, updates });
      console.log("[pathways/actions] updatePhaseTaskAction - Phase task updated and activity logged:", updatedPhaseTask); // LOG ADDED
    } else {
      console.error("[pathways/actions] updatePhaseTaskAction - updatePhaseTask returned null."); // LOG ADDED
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return updatedPhaseTask;
  } catch (error: any) {
    console.error("[pathways/actions] updatePhaseTaskAction - Error during update:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyPhaseTasks" || error.message === "UnauthorizedToUpdateTaskStatus") {
      redirect("/error/403");
    } else if (error.message === "PhaseTaskNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}

export async function deletePhaseTaskAction(taskId: string, phaseId: string, pathwayTemplateId: string): Promise<boolean> {
  try {
    const { user, template, task } = await authorizePhaseTaskAction(taskId, phaseId, pathwayTemplateId, 'write');
    if (!task) {
      throw new Error("PhaseTaskNotFound");
    }

    const success = await deletePhaseTask(taskId);

    if (success) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_task_deleted', `Deleted task "${task.name}" from phase "${phaseId}" in template "${template?.name}".`, { phaseId });
      console.log("[pathways/actions] deletePhaseTaskAction - Phase task deleted and activity logged."); // LOG ADDED
    } else {
      console.error("[pathways/actions] deletePhaseTaskAction - deletePhaseTask returned false."); // LOG ADDED
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return success;
  } catch (error: any) {
    console.error("[pathways/actions] deletePhaseTaskAction - Error during deletion:", error.message); // LOG ADDED
    if (error.message === "UnauthorizedToModifyPhaseTasks") {
      redirect("/error/403");
    } else if (error.message === "PhaseTaskNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}