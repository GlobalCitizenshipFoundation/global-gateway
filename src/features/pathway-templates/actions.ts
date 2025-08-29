"use server";

import { pathwayTemplateService, PathwayTemplate, Phase } from "./services/pathway-template-service";
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
    const { data, error } = await supabase
      .from("pathway_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error) {
      console.error(`Error fetching template ${templateId} for authorization:`, error.message);
      throw new Error("Failed to retrieve template for authorization.");
    }
    template = data;
  }

  if (!template && templateId) {
    throw new Error("Template not found.");
  }

  if (action === 'read') {
    if (!isAdmin && template && template.is_private && template.creator_id !== user.id) {
      throw new Error("Unauthorized access to private template.");
    }
  } else if (action === 'write') { // For 'write' actions (update, delete, create phase, reorder phases)
    if (!isAdmin && template && template.creator_id !== user.id) {
      throw new Error("Unauthorized to modify this template.");
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

  const { data, error } = await supabase
    .from("pathway_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pathway templates:", error.message);
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
    if (error.message === "Unauthorized access to private template.") {
      redirect("/error-pages/403");
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

  if (!name) {
    throw new Error("Template name is required.");
  }

  const newTemplate = await pathwayTemplateService.createPathwayTemplate(
    name,
    description,
    is_private,
    user.id
  );

  revalidatePath("/workbench/pathway-templates");
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

    const updatedTemplate = await pathwayTemplateService.updatePathwayTemplate(
      id,
      { name, description, is_private }
    );

    revalidatePath("/workbench/pathway-templates");
    revalidatePath(`/workbench/pathway-templates/${id}`);
    return updatedTemplate;
  } catch (error: any) {
    console.error("Error in updatePathwayTemplateAction:", error.message);
    if (error.message === "Unauthorized to modify this template.") {
      redirect("/error-pages/403");
    }
    redirect("/login");
  }
}

export async function deletePathwayTemplateAction(id: string): Promise<boolean> {
  try {
    await authorizeTemplateAction(id, 'write'); // Authorize before delete

    const success = await pathwayTemplateService.deletePathwayTemplate(id);

    revalidatePath("/workbench/pathway-templates");
    return success;
  } catch (error: any) {
    console.error("Error in deletePathwayTemplateAction:", error.message);
    if (error.message === "Unauthorized to modify this template.") {
      redirect("/error-pages/403");
    }
    redirect("/login");
  }
}

// --- Phase Management Server Actions ---

export async function getPhasesAction(pathwayTemplateId: string): Promise<Phase[] | null> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'read'); // User must have read access to the parent template
    const phases = await pathwayTemplateService.getPhasesByPathwayTemplateId(pathwayTemplateId);
    return phases;
  } catch (error: any) {
    console.error("Error in getPhasesAction:", error.message);
    if (error.message === "Unauthorized access to private template.") {
      redirect("/error-pages/403");
    }
    redirect("/login");
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

    const newPhase = await pathwayTemplateService.createPhase(
      pathwayTemplateId,
      name,
      type,
      order_index,
      description
    );

    revalidatePath(`/workbench/pathway-templates/${pathwayTemplateId}`);
    return newPhase;
  } catch (error: any) {
    console.error("Error in createPhaseAction:", error.message);
    if (error.message === "Unauthorized to modify this template.") {
      redirect("/error-pages/403");
    }
    throw error; // Re-throw to be caught by client-side toast
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

    const updatedPhase = await pathwayTemplateService.updatePhase(
      phaseId,
      { name, type, description }
    );

    revalidatePath(`/workbench/pathway-templates/${pathwayTemplateId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("Error in updatePhaseAction:", error.message);
    if (error.message === "Unauthorized to modify this template.") {
      redirect("/error-pages/403");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function deletePhaseAction(phaseId: string, pathwayTemplateId: string): Promise<boolean> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'write'); // User must have write access to the parent template

    const success = await pathwayTemplateService.deletePhase(phaseId);

    revalidatePath(`/workbench/pathway-templates/${pathwayTemplateId}`);
    return success;
  } catch (error: any) {
    console.error("Error in deletePhaseAction:", error.message);
    if (error.message === "Unauthorized to modify this template.") {
      redirect("/error-pages/403");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function reorderPhasesAction(pathwayTemplateId: string, phases: { id: string; order_index: number }[]): Promise<boolean> {
  try {
    await authorizeTemplateAction(pathwayTemplateId, 'write'); // User must have write access to the parent template

    // Perform updates in a transaction if possible, or sequentially
    for (const phase of phases) {
      await pathwayTemplateService.updatePhase(phase.id, { order_index: phase.order_index });
    }

    revalidatePath(`/workbench/pathway-templates/${pathwayTemplateId}`);
    return true;
  } catch (error: any) {
    console.error("Error in reorderPhasesAction:", error.message);
    if (error.message === "Unauthorized to modify this template.") {
      redirect("/error-pages/403");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}