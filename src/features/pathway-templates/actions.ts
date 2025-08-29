"use server";

import { pathwayTemplateService, PathwayTemplate } from "./services/pathway-template-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper function to check user authorization
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
  } else if (action === 'write') { // For 'write' actions (update, delete)
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
    // If no user, only public templates should be visible, but for workbench, we redirect.
    // This action is primarily for authenticated workbench users.
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  // Admins can see all templates. Other authenticated users see their own or public templates.
  const { data, error } = await supabase
    .from("pathway_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pathway templates:", error.message);
    return null;
  }

  // Filter on the server if not an admin, to ensure only authorized templates are returned
  const filteredData = data.filter(template => isAdmin || template.creator_id === user.id || !template.is_private);
  return filteredData;
}

export async function getTemplateByIdAction(id: string): Promise<PathwayTemplate | null> {
  try {
    const { user, template, isAdmin } = await authorizeTemplateAction(id, 'read');
    if (!template) {
      return null; // Template not found or unauthorized
    }
    // The authorizeTemplateAction already handles the read access logic
    return template;
  } catch (error: any) {
    console.error("Error in getTemplateByIdAction:", error.message);
    // Redirect to an error page or login if unauthorized
    if (error.message === "Unauthorized access to private template.") {
      redirect("/error-pages/403"); // Forbidden
    }
    redirect("/login"); // Default redirect for other auth issues
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
    const { user, template, isAdmin } = await authorizeTemplateAction(id, 'write');

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
      redirect("/error-pages/403"); // Forbidden
    }
    redirect("/login"); // Default redirect for other auth issues
  }
}

export async function deletePathwayTemplateAction(id: string): Promise<boolean> {
  try {
    const { user, template, isAdmin } = await authorizeTemplateAction(id, 'write');

    const success = await pathwayTemplateService.deletePathwayTemplate(id);

    revalidatePath("/workbench/pathway-templates");
    return success;
  } catch (error: any) {
    console.error("Error in deletePathwayTemplateAction:", error.message);
    if (error.message === "Unauthorized to modify this template.") {
      redirect("/error-pages/403"); // Forbidden
    }
    redirect("/login"); // Default redirect for other auth issues
  }
}