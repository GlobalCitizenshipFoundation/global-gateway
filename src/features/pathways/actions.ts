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
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let template: PathwayTemplate | null = null;
  if (templateId) {
    try {
      template = await getPathwayTemplateById(templateId);
    } catch (serviceError: any) {
      console.error(`Error fetching template ${templateId} in authorizeTemplateAction:`, serviceError.message);
      throw new Error("TemplateNotFound");
    }
    if (!template) {
      throw new Error("TemplateNotFound");
    }
  }

  if (action === 'admin_only') {
    if (!isAdmin) {
      throw new Error("UnauthorizedAccessAdminOnly");
    }
  } else if (action === 'read') {
    if (!isAdmin && template && template.is_private && template.creator_id !== user.id && template.status !== 'published') {
      throw new Error("UnauthorizedAccessToPrivateTemplate");
    }
  } else if (action === 'write' || action === 'version') {
    if (!isAdmin && template && template.creator_id !== user.id) {
      throw new Error("UnauthorizedToModifyTemplate");
    }
  }

  return { user, template, isAdmin };
}

export async function getTemplatesAction(): Promise<PathwayTemplate[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  const data = await getPathwayTemplates();

  if (!data) {
    return null;
  }

  const filteredData = data.filter(template => isAdmin || template.creator_id === user.id || (!template.is_private && template.status === 'published'));
  return filteredData;
}

export async function getTemplateByIdAction(id: string): Promise<PathwayTemplate | null> {
  try {
    const { template } = await authorizeTemplateAction(id, 'read');
    return template;
  } catch (error: any) {
    console.error("Error in getTemplateByIdAction:", error.message);
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
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const is_private = formData.get("is_private") === "on";
  const application_open_date = formData.get("application_open_date") as string || null;
  const participation_deadline = formData.get("participation_deadline") as string || null;
  const general_instructions = formData.get("general_instructions") as string || null;
  const applicant_instructions = formData.get("applicant_instructions") as string || null; // New field
  const manager_instructions = formData.get("manager_instructions") as string || null; // New field
  const is_visible_to_applicants = formData.get("is_visible_to_applicants") === "on"; // New field


  if (!name) {
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
      applicant_instructions, // New field
      manager_instructions, // New field
      is_visible_to_applicants // New field
    );

    if (newTemplate) {
      await createActivityLog(newTemplate.id, user.id, 'created', `Created pathway template "${newTemplate.name}".`);
    }

    revalidatePath("/pathways");
    return newTemplate;
  } catch (error: any) {
    console.error("Error in createPathwayTemplateAction:", error.message);
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
    const application_open_date = formData.get("application_open_date") as string || null;
    const participation_deadline = formData.get("participation_deadline") as string || null;
    const general_instructions = formData.get("general_instructions") as string || null;
    const applicant_instructions = formData.get("applicant_instructions") as string || null; // New field
    const manager_instructions = formData.get("manager_instructions") as string || null; // New field
    const is_visible_to_applicants = formData.get("is_visible_to_applicants") === "on"; // New field

    if (!name) {
      throw new Error("Template name is required.");
    }

    const oldValues = {
      name: template.name,
      description: template.description,
      is_private: template.is_private,
      application_open_date: template.application_open_date,
      participation_deadline: template.participation_deadline,
      general_instructions: template.general_instructions,
      applicant_instructions: template.applicant_instructions, // New field
      manager_instructions: template.manager_instructions, // New field
      is_visible_to_applicants: template.is_visible_to_applicants, // New field
    };
    const newValues = {
      name,
      description,
      is_private,
      application_open_date,
      participation_deadline,
      general_instructions,
      applicant_instructions,
      manager_instructions,
      is_visible_to_applicants,
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
        applicant_instructions,
        manager_instructions,
        is_visible_to_applicants,
      },
      user.id
    );

    if (updatedTemplate) {
      await createActivityLog(updatedTemplate.id, user.id, 'updated', `Updated pathway template "${updatedTemplate.name}".`, { oldValues, newValues });
    }

    revalidatePath("/pathways");
    revalidatePath(`/pathways/${id}`);
    return updatedTemplate;
  } catch (error: any) {
    console.error("Error in updatePathwayTemplateAction:", error.message);
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
    const { user, template } = await authorizeTemplateAction(id, 'write'); // Use 'write' for hard delete
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const success = await deletePathwayTemplate(id); // Call the hard delete service

    if (success) {
      await createActivityLog(id, user.id, 'deleted', `Deleted pathway template "${template.name}".`);
    }

    revalidatePath("/pathways");
    return success;
  } catch (error: any) {
    console.error("Error in deletePathwayTemplateAction:", error.message);
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
    }

    revalidatePath("/pathways");
    revalidatePath(`/pathways/${id}`);
    return updatedTemplate;
  } catch (error: any) {
    console.error("Error in updatePathwayTemplateStatusAction:", error.message);
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
      throw new Error("Failed to update template status to published.");
    }

    // Then, create a new version snapshot
    const phases = await getPhasesByPathwayTemplateId(id);
    const snapshot = { template, phases: phases || [] };

    const newVersion = await createTemplateVersion(id, snapshot, user.id);

    if (newVersion) {
      await createActivityLog(id, user.id, 'published', `Published new version ${newVersion.version_number} of template "${template.name}".`);
    }

    revalidatePath("/pathways");
    revalidatePath(`/pathways/${id}`);
    return newVersion;
  } catch (error: any) {
    console.error("Error in publishPathwayTemplateAction:", error.message);
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
    return phases;
  } catch (error: any) {
    console.error("Error in getPhasesAction:", error.message);
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

export async function createPhaseAction(pathwayTemplateId: string, formData: FormData): Promise<Phase | null> {
  try {
    const { user, template } = await authorizeTemplateAction(pathwayTemplateId, 'write');
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    const order_index = parseInt(formData.get("order_index") as string);
    const phase_start_date = formData.get("phase_start_date") as string || null; // New field
    const phase_end_date = formData.get("phase_end_date") as string || null; // New field
    const applicant_instructions = formData.get("applicant_instructions") as string || null; // New field
    const manager_instructions = formData.get("manager_instructions") as string || null; // New field
    const is_visible_to_applicants = formData.get("is_visible_to_applicants") === "on"; // New field


    if (!name || !type || isNaN(order_index)) {
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
      phase_start_date, // New field
      phase_end_date, // New field
      applicant_instructions, // New field
      manager_instructions, // New field
      is_visible_to_applicants // New field
    );

    if (newPhase) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_added', `Added phase "${newPhase.name}" (${newPhase.type}) to template "${template.name}".`, { phaseId: newPhase.id });
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return newPhase;
  } catch (error: any) {
    console.error("Error in createPhaseAction:", error.message);
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
    const description = formData.get("description") as string | null;
    const phase_start_date = formData.get("phase_start_date") as string || null; // New field
    const phase_end_date = formData.get("phase_end_date") as string || null; // New field
    const applicant_instructions = formData.get("applicant_instructions") as string || null; // New field
    const manager_instructions = formData.get("manager_instructions") as string || null; // New field
    const is_visible_to_applicants = formData.get("is_visible_to_applicants") === "on"; // New field


    if (!name || !type) {
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
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("Error in updatePhaseAction:", error.message);
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

    const updatedPhase = await updatePhaseService(
      phaseId,
      { config: configUpdates },
      user.id
    );

    if (updatedPhase) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_config_updated', `Updated configuration for phase "${updatedPhase.name}" in template "${template.name}".`, { phaseId: updatedPhase.id, configUpdates });
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("Error in updatePhaseConfigAction:", error.message);
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

    const next_phase_id_on_success = formData.get("next_phase_id_on_success") as string | null;
    const next_phase_id_on_failure = formData.get("next_phase_id_on_failure") as string | null;

    // Basic validation: Ensure selected phases exist within the same template
    const allPhases = await getPhasesByPathwayTemplateId(pathwayTemplateId);
    if (next_phase_id_on_success && !allPhases?.some(p => p.id === next_phase_id_on_success)) {
      throw new Error("Selected success phase does not exist in this template.");
    }
    if (next_phase_id_on_failure && !allPhases?.some(p => p.id === next_phase_id_on_failure)) {
      throw new Error("Selected failure phase does not exist in this template.");
    }

    const configUpdates = {
      next_phase_id_on_success: next_phase_id_on_success || null,
      next_phase_id_on_failure: next_phase_id_on_failure || null,
    };

    const updatedPhase = await updatePhaseBranchingConfigService(phaseId, configUpdates, user.id);

    if (updatedPhase) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_branching_updated', `Updated branching for phase "${updatedPhase.name}" in template "${template.name}".`, { phaseId: updatedPhase.id, configUpdates });
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("Error in updatePhaseBranchingAction:", error.message);
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
    const { user, template } = await authorizeTemplateAction(pathwayTemplateId, 'write'); // Reusing authorizeTemplateAction for template auth
    if (!template) {
      throw new Error("TemplateNotFound");
    }

    const success = await deletePhase(phaseId); // Call the hard delete service

    if (success) {
      await createActivityLog(pathwayTemplateId, user.id, 'phase_deleted', `Deleted phase "${phaseId}" from template "${template?.name}".`, { phaseId });
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return success;
  } catch (error: any) {
    console.error("Error in deletePhaseAction:", error.message);
    if (error.message === "UnauthorizedToModifyTemplate") { // Error message from authorizeTemplateAction
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

    for (const phase of phases) {
      await updatePhaseService(phase.id, { order_index: phase.order_index }, user.id);
    }

    await createActivityLog(pathwayTemplateId, user.id, 'phases_reordered', `Reordered phases in template "${template.name}".`, { newOrder: phases.map(p => ({ id: p.id, order_index: p.order_index })) });

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return true;
  } catch (error: any) {
    console.error("Error in reorderPhasesAction:", error.message);
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
    redirect("/login");
  }

  try {
    const { template } = await authorizeTemplateAction(templateId, 'read');
    if (!template) {
      throw new Error("TemplateNotFound");
    }
  } catch (error: any) {
    console.error("Error in clonePathwayTemplateAction authorization:", error.message);
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
    throw new Error("New template name is required.");
  }

  try {
    const clonedTemplate = await clonePathwayTemplate(
      templateId,
      newName,
      user.id,
      user.id // last_updated_by for new template and phases
    );
    if (clonedTemplate) {
      await createActivityLog(clonedTemplate.id, user.id, 'cloned', `Cloned template "${templateId}" to new template "${clonedTemplate.name}".`, { originalTemplateId: templateId });
    }
    revalidatePath("/pathways");
    return clonedTemplate;
  } catch (error: any) {
    console.error("Error in clonePathwayTemplateAction:", error.message);
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
    }

    revalidatePath("/pathways");
    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return newVersion;
  } catch (error: any) {
    console.error("Error in createTemplateVersionAction:", error.message);
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
    return versions;
  } catch (error: any) {
    console.error("Error in getTemplateVersionsAction:", error.message);
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
      throw new Error("TemplateVersionNotFound");
    }
    await authorizeTemplateAction(version.pathway_template_id, 'read');
    return version;
  } catch (error: any) {
    console.error("Error in getTemplateVersionAction:", error.message);
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

    const rolledBackTemplate = await rollbackTemplateToVersion(pathwayTemplateId, versionId, user.id);

    if (rolledBackTemplate) {
      await createActivityLog(pathwayTemplateId, user.id, 'rolled_back', `Rolled back template "${template.name}" to version "${versionId}".`, { versionId });
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return rolledBackTemplate;
  } catch (error: any) {
    console.error("Error in rollbackTemplateToVersionAction:", error.message);
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
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  // First, authorize access to the parent phase's template
  const { template } = await authorizeTemplateAction(pathwayTemplateId, 'read');
  if (!template) {
    throw new Error("ParentTemplateNotFound");
  }
  const isPhaseCreator = template.creator_id === user.id;

  let task: PhaseTask | null = null;
  if (taskId) {
    const tasks = await getPhaseTasksByPhaseId(phaseId);
    task = tasks?.find(t => t.id === taskId) || null;
    if (!task) {
      throw new Error("PhaseTaskNotFound");
    }
  }

  const isAssignedUser = task?.assigned_to_user_id === user.id;

  if (action === 'read') {
    // RLS on phase_tasks handles read access based on parent phase/template
  } else if (action === 'write') {
    if (!isAdmin && !isPhaseCreator) {
      throw new Error("UnauthorizedToModifyPhaseTasks");
    }
  } else if (action === 'update_status') {
    if (!isAdmin && !isPhaseCreator && !isAssignedUser) {
      throw new Error("UnauthorizedToUpdateTaskStatus");
    }
  }

  return { user, task, isAdmin, isPhaseCreator, isAssignedUser, template };
}

export async function getPhaseTasksAction(phaseId: string): Promise<PhaseTask[] | null> {
  try {
    // Authorize read access to the parent phase's template
    // We need the pathwayTemplateId to authorize, so we'll fetch the phase first
    const supabase = await createClient();
    const { data: phaseData, error: phaseError } = await supabase.from('phases').select('pathway_template_id').eq('id', phaseId).single();
    if (phaseError || !phaseData) {
      throw new Error("PhaseNotFound");
    }
    await authorizeTemplateAction(phaseData.pathway_template_id, 'read');
    const tasks = await getPhaseTasksByPhaseId(phaseId);
    return tasks;
  } catch (error: any) {
    console.error("Error in getPhaseTasksAction:", error.message);
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
    const description = formData.get("description") as string | null;
    const assigned_to_role = formData.get("assigned_to_role") as string | null;
    const assigned_to_user_id = formData.get("assigned_to_user_id") as string | null;
    const due_date_str = formData.get("due_date") as string | null;
    const order_index = parseInt(formData.get("order_index") as string);

    if (!name || isNaN(order_index)) {
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
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return newPhaseTask;
  } catch (error: any) {
    console.error("Error in createPhaseTaskAction:", error.message);
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
    const name = formData.get("name") as string | undefined;
    const description = formData.get("description") as string | null | undefined;
    const assigned_to_role = formData.get("assigned_to_role") as string | null | undefined;
    const assigned_to_user_id = formData.get("assigned_to_user_id") as string | null | undefined;
    const due_date_str = formData.get("due_date") as string | null | undefined;
    const status = formData.get("status") as PhaseTask['status'] | undefined;

    // Only allow status update by assigned user, creator, or admin
    if (status !== undefined) {
      const { user: statusUser, task: statusTask, isAdmin: statusIsAdmin, isPhaseCreator: statusIsPhaseCreator, isAssignedUser: statusIsAssignedUser } = await authorizePhaseTaskAction(taskId, phaseId, pathwayTemplateId, 'update_status');
      if (!statusIsAdmin && !statusIsPhaseCreator && !statusIsAssignedUser) {
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
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return updatedPhaseTask;
  } catch (error: any) {
    console.error("Error in updatePhaseTaskAction:", error.message);
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
    }

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return success;
  } catch (error: any) {
    console.error("Error in deletePhaseTaskAction:", error.message);
    if (error.message === "UnauthorizedToModifyPhaseTasks") {
      redirect("/error/403");
    } else if (error.message === "PhaseTaskNotFound") {
      redirect("/error/404");
    }
    throw error;
  }
}