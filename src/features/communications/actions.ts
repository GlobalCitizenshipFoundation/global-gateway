"use server";

import { communicationService, CommunicationTemplate } from "./services/communication-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper function to check user authorization for a communication template
async function authorizeCommunicationTemplateAction(templateId: string, action: 'read' | 'write'): Promise<{ user: any; template: CommunicationTemplate | null; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let template: CommunicationTemplate | null = null;
  if (templateId) {
    const { data, error } = await supabase
      .from("communication_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found for eq filter
        throw new Error("CommunicationTemplateNotFound");
      }
      console.error(`Error fetching communication template ${templateId} for authorization:`, error.message);
      throw new Error("FailedToRetrieveCommunicationTemplate");
    }
    template = data;
  }

  if (!template && templateId) {
    throw new Error("CommunicationTemplateNotFound");
  }

  if (action === 'read') {
    if (!isAdmin && template && template.is_public === false && template.creator_id !== user.id) {
      throw new Error("UnauthorizedAccessToPrivateCommunicationTemplate");
    }
  } else if (action === 'write') { // For 'write' actions (update, delete)
    if (!isAdmin && template && template.creator_id !== user.id) {
      throw new Error("UnauthorizedToModifyCommunicationTemplate");
    }
  }

  return { user, template, isAdmin };
}

export async function getCommunicationTemplatesAction(): Promise<CommunicationTemplate[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  const { data, error } = await supabase
    .from("communication_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching communication templates:", error.message);
    return null;
  }

  const filteredData = data.filter(template => isAdmin || template.creator_id === user.id || template.is_public);
  return filteredData;
}

export async function getCommunicationTemplateByIdAction(id: string): Promise<CommunicationTemplate | null> {
  try {
    const { template } = await authorizeCommunicationTemplateAction(id, 'read');
    return template;
  } catch (error: any) {
    console.error("Error in getCommunicationTemplateByIdAction:", error.message);
    if (error.message === "UnauthorizedAccessToPrivateCommunicationTemplate") {
      redirect("/error-pages/403");
    } else if (error.message === "CommunicationTemplateNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCommunicationTemplate") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function createCommunicationTemplateAction(formData: FormData): Promise<CommunicationTemplate | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const type = formData.get("type") as CommunicationTemplate['type'];
  const is_public = formData.get("is_public") === "on";

  if (!name || !subject || !body || !type) {
    throw new Error("Template name, subject, body, and type are required.");
  }

  try {
    const newTemplate = await communicationService.createCommunicationTemplate(
      name,
      subject,
      body,
      type,
      is_public,
      user.id
    );

    revalidatePath("/workbench/communications/templates");
    return newTemplate;
  } catch (error: any) {
    console.error("Error in createCommunicationTemplateAction:", error.message);
    throw error; // Re-throw to be caught by client-side toast for form errors
  }
}

export async function updateCommunicationTemplateAction(id: string, formData: FormData): Promise<CommunicationTemplate | null> {
  try {
    await authorizeCommunicationTemplateAction(id, 'write'); // Authorize before update

    const name = formData.get("name") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const type = formData.get("type") as CommunicationTemplate['type'];
    const is_public = formData.get("is_public") === "on";

    if (!name || !subject || !body || !type) {
      throw new Error("Template name, subject, body, and type are required.");
    }

    const updatedTemplate = await communicationService.updateCommunicationTemplate(
      id,
      { name, subject, body, type, is_public }
    );

    revalidatePath("/workbench/communications/templates");
    revalidatePath(`/workbench/communications/templates/${id}`);
    return updatedTemplate;
  } catch (error: any) {
    console.error("Error in updateCommunicationTemplateAction:", error.message);
    if (error.message === "UnauthorizedToModifyCommunicationTemplate") {
      redirect("/error-pages/403");
    } else if (error.message === "CommunicationTemplateNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCommunicationTemplate") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function deleteCommunicationTemplateAction(id: string): Promise<boolean> {
  try {
    await authorizeCommunicationTemplateAction(id, 'write'); // Authorize before delete

    const success = await communicationService.deleteCommunicationTemplate(id);

    revalidatePath("/workbench/communications/templates");
    return success;
  } catch (error: any) {
    console.error("Error in deleteCommunicationTemplateAction:", error.message);
    if (error.message === "UnauthorizedToModifyCommunicationTemplate") {
      redirect("/error-pages/403");
    } else if (error.message === "CommunicationTemplateNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCommunicationTemplate") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}