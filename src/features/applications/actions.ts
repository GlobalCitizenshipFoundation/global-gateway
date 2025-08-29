"use server";

import { applicationService, Application } from "@/features/applications/services/application-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper function to check user authorization for an application
async function authorizeApplicationAction(applicationId: string, action: 'read' | 'write'): Promise<{ user: any; application: Application | null; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let application: Application | null = null;
  if (applicationId) {
    const { data, error } = await supabase
      .from("applications")
      .select("*, campaigns(creator_id, is_public)") // Fetch campaign creator_id and is_public for authorization
      .eq("id", applicationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found for eq filter
        throw new Error("ApplicationNotFound");
      }
      console.error(`Error fetching application ${applicationId} for authorization:`, error.message);
      throw new Error("FailedToRetrieveApplication");
    }
    application = data;
  }

  if (!application && applicationId) {
    throw new Error("ApplicationNotFound");
  }

  // Authorization logic
  const isApplicant = user.id === application?.applicant_id;
  const isCampaignCreator = user.id === application?.campaigns?.creator_id;
  const isPublicCampaign = application?.campaigns?.is_public;

  if (action === 'read') {
    if (!isAdmin && !isApplicant && !isCampaignCreator && !isPublicCampaign) {
      throw new Error("UnauthorizedAccessToApplication");
    }
  } else if (action === 'write') {
    // Only applicant can update their own application (except screening_status/current_phase)
    // Only campaign creator/admin can update screening_status/current_phase
    if (!isAdmin && !isApplicant && !isCampaignCreator) {
      throw new Error("UnauthorizedToModifyApplication");
    }
  }

  return { user, application, isAdmin };
}

export async function getApplicationsAction(): Promise<Application[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  const { data, error } = await supabase
    .from("applications")
    .select("*, campaigns(id, name, creator_id, is_public), profiles(first_name, last_name, avatar_url), current_campaign_phases(id, name, type, order_index)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error.message);
    return null;
  }

  // Client-side filtering for non-admin users to ensure they only see relevant applications
  const filteredData = data.filter(app =>
    isAdmin ||
    app.applicant_id === user.id || // Applicant can see their own
    app.campaigns?.creator_id === user.id || // Campaign creator can see applications for their campaigns
    app.campaigns?.is_public // Anyone can see applications for public campaigns (if they exist)
  );

  return filteredData as Application[];
}

export async function getApplicationByIdAction(id: string): Promise<Application | null> {
  try {
    const { application } = await authorizeApplicationAction(id, 'read');
    return application;
  } catch (error: any) {
    console.error("Error in getApplicationByIdAction:", error.message);
    if (error.message === "UnauthorizedAccessToApplication") {
      redirect("/error-pages/403");
    } else if (error.message === "ApplicationNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveApplication") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function createApplicationAction(campaignId: string, formData: FormData): Promise<Application | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Basic authorization: only authenticated users can create applications
  // Further checks (e.g., if campaign is open) would be done here
  const applicantId = user.id;
  const initialData = JSON.parse(formData.get("data") as string || '{}');
  const status = formData.get("status") as Application['status'] || 'draft';
  const screening_status = formData.get("screening_status") as Application['screening_status'] || 'Pending';

  try {
    const newApplication = await applicationService.createApplication(
      campaignId,
      applicantId,
      initialData,
      status,
      screening_status
    );
    revalidatePath(`/portal/my-applications`);
    revalidatePath(`/workbench/applications`); // Revalidate for recruiters
    return newApplication;
  } catch (error: any) {
    console.error("Error in createApplicationAction:", error.message);
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function updateApplicationAction(id: string, formData: FormData): Promise<Application | null> {
  try {
    const { user, application, isAdmin } = await authorizeApplicationAction(id, 'write');

    if (!application) {
      throw new Error("ApplicationNotFound");
    }

    const updates: Partial<Application> = {};
    const isApplicant = user.id === application.applicant_id;
    const isCampaignCreator = user.id === application.campaigns?.creator_id;

    // Fields that can be updated by anyone with write access (applicant or campaign creator/admin)
    if (formData.has("data")) updates.data = JSON.parse(formData.get("data") as string);
    if (formData.has("status")) updates.status = formData.get("status") as Application['status'];

    // Fields that can ONLY be updated by campaign creator/admin (e.g., screening status, moving phases)
    if (formData.has("screening_status") && (isAdmin || isCampaignCreator)) {
      updates.screening_status = formData.get("screening_status") as Application['screening_status'];
    } else if (formData.has("screening_status") && isApplicant) {
      // If applicant tries to update screening_status, ignore or throw error
      console.warn("Applicant attempted to update screening_status, action ignored.");
    }

    if (formData.has("current_campaign_phase_id") && (isAdmin || isCampaignCreator)) {
      updates.current_campaign_phase_id = formData.get("current_campaign_phase_id") as string;
    } else if (formData.has("current_campaign_phase_id") && isApplicant) {
      console.warn("Applicant attempted to update current_campaign_phase_id, action ignored.");
    }

    const updatedApplication = await applicationService.updateApplication(id, updates);

    revalidatePath(`/portal/my-applications`);
    revalidatePath(`/workbench/applications`);
    revalidatePath(`/workbench/applications/${id}`); // Revalidate specific application detail page
    return updatedApplication;
  } catch (error: any) {
    console.error("Error in updateApplicationAction:", error.message);
    if (error.message === "UnauthorizedToModifyApplication") {
      redirect("/error-pages/403");
    } else if (error.message === "ApplicationNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveApplication") {
      redirect("/error-pages/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function deleteApplicationAction(id: string): Promise<boolean> {
  try {
    await authorizeApplicationAction(id, 'write'); // Only campaign creator/admin can delete applications

    const success = await applicationService.deleteApplication(id);

    revalidatePath("/portal/my-applications");
    revalidatePath("/workbench/applications");
    return success;
  } catch (error: any) {
    console.error("Error in deleteApplicationAction:", error.message);
    if (error.message === "UnauthorizedToModifyApplication") {
      redirect("/error-pages/403");
    } else if (error.message === "ApplicationNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveApplication") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}