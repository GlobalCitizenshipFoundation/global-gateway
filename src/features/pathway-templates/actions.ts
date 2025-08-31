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
} from "./services/pathway-template-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper function to check user authorization for a template
async function authorizeTemplateAction(templateId: string, action: 'read' | 'write'): Promise<{ user: any; template: PathwayTemplate | null; isAdmin: boolean }> {
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
  } else if (action === 'write') { // For 'write' actions (update, delete, create phase, reorder phases)
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

  revalidatePath("/pathway-templates"); // Corrected path
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

    revalidatePath("/pathway-templates"); // Corrected path
    revalidatePath(`/pathway-templates/${id}`); // Corrected path
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

    revalidatePath("/pathway-templates"); // Corrected path
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

    revalidatePath(`/pathway-templates/${pathwayTemplateId}`); // Corrected path
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

    const updatedPhase = await updatePhase( // Use the service function
      phaseId,
      { name, type, description }
    );

    revalidatePath(`/pathway-templates/${pathwayTemplateId}`); // Corrected path
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

    revalidatePath(`/pathway-templates/${pathwayTemplateId}`); // Corrected path
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

export async function deletePhaseAction(phaseId: string, pathwayTemplateId: string): Promise<boolean> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'write'); // User must have write access to the parent template

    const success = await deletePhase(phaseId); // Use the service function

    revalidatePath(`/pathway-templates/${pathwayTemplateId}`); // Corrected path
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

    revalidatePath(`/pathway-templates/${pathwayTemplateId}`); // Corrected path
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
    revalidatePath("/pathway-templates"); // Corrected path
    return clonedTemplate;
  } catch (error: any) {
    console.error("Error in clonePathwayTemplateAction:", error.message);
    throw error; // Re-throw to be caught by client-side toast
  }
}