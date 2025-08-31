"use server";

import {
  PathwayTemplate,
  Phase,
  getPathwayTemplates,
  getPathwayTemplateById,
  createPathwayTemplate,
  updatePathwayTemplate,
  deletePathwayTemplate,
  getPhasesByPathwayTemplateId,
  createPhase,
  updatePhase,
  deletePhase,
  clonePathwayTemplate,
  updatePhase as updatePhaseService, // Renamed to avoid conflict with local updatePhaseAction
  updatePhaseBranchingConfig as updatePhaseBranchingConfigService, // Import new service function
} from "./services/pathway-template-service";
import {
  PhaseTask,
  getPhaseTasksByPhaseId,
  createPhaseTask,
  updatePhaseTask,
  deletePhaseTask,
} from "./services/phase-task-service"; // Import new phase task service
import {
  PathwayTemplateVersion,
  createTemplateVersion,
  getTemplateVersions,
  getTemplateVersion,
  rollbackTemplateToVersion,
} from "./services/template-versioning-service"; // Import new versioning service
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper function to check user authorization for a template
async function authorizeTemplateAction(templateId: string, action: 'read' | 'write' | 'version'): Promise<{ user: any; template: PathwayTemplate | null; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let template: PathwayTemplate | null = null;
  if (templateId) {
    // Use the service function to fetch the template
    template = await getPathwayTemplateById(templateId);
    if (!template) {
      throw new Error("TemplateNotFound");
    }
  }

  if (!template && templateId) {
    throw new Error("TemplateNotFound");
  }

  if (action === 'read') {
    if (!isAdmin && template && template.is_private && template.creator_id !== user.id) {
      throw new Error("UnauthorizedAccessToPrivateTemplate");
    }
  } else if (action === 'write' || action === 'version') { // For 'write' actions (update, delete, create phase, reorder phases) and versioning
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

  const data = await getPathwayTemplates(); // Use the service function

  if (!data) {
    return null;
  }

  const filteredData = data.filter(template => isAdmin || template.creator_id === user.id || !template.is_private);
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
    redirect("/login"); // Fallback for unauthenticated or other critical errors
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
  const is_private = formData.get("is_private") === "on"; // Checkbox value

  if (!name) {
    throw new Error("Template name is required.");
  }

  const newTemplate = await createPathwayTemplate( // Use the service function
    name,
    description,
    is_private,
    user.id
  );

  revalidatePath("/pathways");
  return newTemplate;
}

export async function updatePathwayTemplateAction(id: string, formData: FormData): Promise<PathwayTemplate | null> {
  try {
    await authorizeTemplateAction(id, 'write'); // Authorize before update

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const is_private = formData.get("is_private") === "on";

    if (!name) {
      throw new Error("Template name is required.");
    }

    const updatedTemplate = await updatePathwayTemplate( // Use the service function
      id,
      { name, description, is_private }
    );

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
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function deletePathwayTemplateAction(id: string): Promise<boolean> {
  try {
    await authorizeTemplateAction(id, 'write'); // Authorize before delete

    const success = await deletePathwayTemplate(id); // Use the service function

    revalidatePath("/pathways");
    return success;
  } catch (error: any) {
    console.error("Error in deletePathwayTemplateAction:", error.message);
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

// --- Phase Management Server Actions ---

export async function getPhasesAction(pathwayTemplateId: string): Promise<Phase[] | null> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'read'); // User must have read access to the parent template
    const phases = await getPhasesByPathwayTemplateId(pathwayTemplateId); // Use the service function
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
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function createPhaseAction(pathwayTemplateId: string, formData: FormData): Promise<Phase | null> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'write'); // User must have write access to the parent template

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    const order_index = parseInt(formData.get("order_index") as string);

    if (!name || !type || isNaN(order_index)) {
      throw new Error("Phase name, type, and order index are required.");
    }

    const newPhase = await createPhase( // Use the service function
      pathwayTemplateId,
      name,
      type,
      order_index,
      description
    );

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
    throw error; // Re-throw to be caught by client-side toast for form errors
  }
}

export async function updatePhaseAction(phaseId: string, pathwayTemplateId: string, formData: FormData): Promise<Phase | null> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'write'); // User must have write access to the parent template

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    // order_index is not updated via form, but via reorder action

    if (!name || !type) {
      throw new Error("Phase name and type are required.");
    }

    const updatedPhase = await updatePhaseService( // Use the service function (renamed import)
      phaseId,
      { name, type, description }
    );

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
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function updatePhaseConfigAction(phaseId: string, pathwayTemplateId: string, configUpdates: Record<string, any>): Promise<Phase | null> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'write'); // User must have write access to the parent template

    const updatedPhase = await updatePhaseService( // Use the service function (renamed import)
      phaseId,
      { config: configUpdates }
    );

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
    throw error; // Re-throw to be caught by client-side toast
  }
}

// New Server Action for updating phase branching configuration
export async function updatePhaseBranchingAction(phaseId: string, pathwayTemplateId: string, formData: FormData): Promise<Phase | null> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'write'); // User must have write access to the parent template

    const next_phase_id_on_success = formData.get("next_phase_id_on_success") as string | null;
    const next_phase_id_on_failure = formData.get("next_phase_id_on_failure") as string | null;

    // Basic validation: Ensure selected phases exist within the same template
    if (next_phase_id_on_success) {
      const successPhases = await getPhasesByPathwayTemplateId(pathwayTemplateId);
      if (!successPhases?.some(p => p.id === next_phase_id_on_success)) {
        throw new Error("Selected success phase does not exist in this template.");
      }
    }
    if (next_phase_id_on_failure) {
      const failurePhases = await getPhasesByPathwayTemplateId(pathwayTemplateId);
      if (!failurePhases?.some(p => p.id === next_phase_id_on_failure)) {
        throw new Error("Selected failure phase does not exist in this template.");
      }
    }

    const configUpdates = {
      next_phase_id_on_success: next_phase_id_on_success || null,
      next_phase_id_on_failure: next_phase_id_on_failure || null,
    };

    const updatedPhase = await updatePhaseBranchingConfigService(phaseId, configUpdates);

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
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function deletePhaseAction(phaseId: string, pathwayTemplateId: string): Promise<boolean> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'write'); // User must have write access to the parent template

    const success = await deletePhase(phaseId); // Use the service function

    revalidatePath(`/pathways/${pathwayTemplateId}`);
    return success;
  } catch (error: any) {
    console.error("Error in deletePhaseAction:", error.message);
    if (error.message === "UnauthorizedToModifyTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function reorderPhasesAction(pathwayTemplateId: string, phases: { id: string; order_index: number }[]): Promise<boolean> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'write'); // User must have write access to the parent template

    // Perform updates in a transaction if possible, or sequentially
    for (const phase of phases) {
      await updatePhaseService(phase.id, { order_index: phase.order_index }); // Use the service function (renamed import)
    }

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
    throw error; // Re-throw to be caught by client-side toast
  }
}

// --- Template Cloning Server Action ---
export async function clonePathwayTemplateAction(templateId: string, newName: string): Promise<PathwayTemplate | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Authorization check: User must have read access to the original template to clone it.
  // The service function will handle fetching the template, so we just need to ensure the user is authenticated.
  // The RLS on pathway_templates will ensure they can only read public or their own templates.
  // If they are an admin, they can clone any template.
  try {
    await authorizeTemplateAction(templateId, 'read');
  } catch (error: any) {
    console.error("Error in clonePathwayTemplateAction authorization:", error.message);
    if (error.message === "UnauthorizedAccessToPrivateTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }

  if (!newName) {
    throw new Error("New template name is required.");
  }

  try {
    const clonedTemplate = await clonePathwayTemplate( // Use the service function
      templateId,
      newName,
      user.id // The new template will be owned by the current user
    );
    revalidatePath("/pathways");
    return clonedTemplate;
  } catch (error: any) {
    console.error("Error in clonePathwayTemplateAction:", error.message);
    throw error; // Re-throw to be caught by client-side toast
  }
}

// --- Phase Task Management Server Actions ---

// Helper function to authorize access to a phase task
async function authorizePhaseTaskAction(taskId: string | null, phaseId: string, action: 'read' | 'write' | 'update_status'): Promise<{ user: any; task: PhaseTask | null; isAdmin: boolean; isPhaseCreator: boolean; isAssignedUser: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  // First, authorize access to the parent phase/template
  const { template } = await authorizeTemplateAction(phaseId, 'read'); // Read access to parent template is sufficient for task read
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
  } else if (action === 'write') { // For create, update (except status), delete
    if (!isAdmin && !isPhaseCreator) {
      throw new Error("UnauthorizedToModifyPhaseTasks");
    }
  } else if (action === 'update_status') { // Specific for updating task status
    if (!isAdmin && !isPhaseCreator && !isAssignedUser) {
      throw new Error("UnauthorizedToUpdateTaskStatus");
    }
  }

  return { user, task, isAdmin, isPhaseCreator, isAssignedUser };
}

export async function getPhaseTasksAction(phaseId: string): Promise<PhaseTask[] | null> {
  try {
    // Authorize read access to the parent phase's template
    await authorizeTemplateAction(phaseId, 'read');
    const tasks = await getPhaseTasksByPhaseId(phaseId);
    return tasks;
  } catch (error: any) {
    console.error("Error in getPhaseTasksAction:", error.message);
    if (error.message === "UnauthorizedAccessToPrivateTemplate") {
      redirect("/error/403");
    } else if (error.message === "TemplateNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveTemplate") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback
  }
}

export async function createPhaseTaskAction(phaseId: string, formData: FormData): Promise<PhaseTask | null> {
  try {
    await authorizePhaseTaskAction(null, phaseId, 'write'); // Authorize creation

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

    revalidatePath(`/pathways/${phaseId}`); // Revalidate parent template detail
    return newPhaseTask;
  } catch (error: any) {
    console.error("Error in createPhaseTaskAction:", error.message);
    if (error.message === "UnauthorizedToModifyPhaseTasks") {
      redirect("/error/403");
    }
    throw error; // Re-throw for client-side toast
  }
}

export async function updatePhaseTaskAction(taskId: string, phaseId: string, formData: FormData): Promise<PhaseTask | null> {
  try {
    const { user, task, isAdmin, isPhaseCreator, isAssignedUser } = await authorizePhaseTaskAction(taskId, phaseId, 'write');
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
      const { user: statusUser, task: statusTask, isAdmin: statusIsAdmin, isPhaseCreator: statusIsPhaseCreator, isAssignedUser: statusIsAssignedUser } = await authorizePhaseTaskAction(taskId, phaseId, 'update_status');
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

    revalidatePath(`/pathways/${phaseId}`);
    return updatedPhaseTask;
  } catch (error: any) {
    console.error("Error in updatePhaseTaskAction:", error.message);
    if (error.message === "UnauthorizedToModifyPhaseTasks" || error.message === "UnauthorizedToUpdateTaskStatus") {
      redirect("/error/403");
    } else if (error.message === "PhaseTaskNotFound") {
      redirect("/error/404");
    }
    throw error; // Re-throw for client-side toast
  }
}

export async function deletePhaseTaskAction(taskId: string, phaseId: string): Promise<boolean> {
  try {
    await authorizePhaseTaskAction(taskId, phaseId, 'write'); // Authorize deletion

    const success = await deletePhaseTask(taskId);

    revalidatePath(`/pathways/${phaseId}`);
    return success;
  } catch (error: any) {
    console.error("Error in deletePhaseTaskAction:", error.message);
    if (error.message === "UnauthorizedToModifyPhaseTasks") {
      redirect("/error/403");
    } else if (error.message === "PhaseTaskNotFound") {
      redirect("/error/404");
    }
    throw error; // Re-throw for client-side toast
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
    await authorizeTemplateAction(version.pathway_template_id, 'read'); // Authorize access to parent template
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
    await authorizeTemplateAction(pathwayTemplateId, 'write'); // User must have write access to the template

    const rolledBackTemplate = await rollbackTemplateToVersion(pathwayTemplateId, versionId);

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