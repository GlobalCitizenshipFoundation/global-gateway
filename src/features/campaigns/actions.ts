"use server";

import {
  Campaign,
  CampaignPhase,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignPhasesByCampaignId,
  createCampaignPhase,
  updateCampaignPhase,
  deleteCampaignPhase,
  deepCopyPhasesFromTemplate,
  updateCampaignPhase as updateCampaignPhaseService, // Renamed to avoid conflict
} from "@/features/campaigns/services/campaign-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProgramById } from "@/features/programs/services/program-service"; // Import specific function directly
import { getPathwayTemplateById } from "@/features/pathways/services/pathway-template-service"; // Import specific function

// Helper function to check user authorization for a campaign
async function authorizeCampaignAction(campaignId: string, action: 'read' | 'write'): Promise<{ user: any; campaign: Campaign | null; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let campaign: Campaign | null = null;
  if (campaignId) {
    // Use the service function to fetch the campaign
    campaign = await getCampaignById(campaignId);
    if (!campaign) {
      throw new Error("CampaignNotFound");
    }
  }

  if (!campaign && campaignId) {
    throw new Error("CampaignNotFound");
  }

  // Authorization logic
  const isCampaignCreator = user.id === campaign?.creator_id;
  const isProgramCreator = campaign?.program_id && user.id === campaign?.programs?.creator_id;
  const isPublicCampaign = campaign?.is_public;

  if (action === 'read') {
    if (!isAdmin && !isCampaignCreator && !isProgramCreator && !isPublicCampaign) {
      throw new Error("UnauthorizedAccessToPrivateCampaign");
    }
  } else if (action === 'write') { // For 'write' actions (update, delete)
    if (!isAdmin && !isCampaignCreator && !isProgramCreator) {
      throw new Error("UnauthorizedToModifyCampaign");
    }
  }

  return { user, campaign, isAdmin };
}

export async function getCampaignsAction(): Promise<Campaign[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  const data = await getCampaigns(); // Use the service function

  if (!data) {
    return null;
  }

  const filteredData = data.filter(campaign =>
    isAdmin ||
    campaign.creator_id === user.id ||
    campaign.is_public ||
    (campaign.program_id && campaign.programs?.creator_id === user.id) // Program creator can see campaigns in their programs
  );
  return filteredData as Campaign[];
}

export async function getCampaignByIdAction(id: string): Promise<Campaign | null> {
  try {
    const { campaign } = await authorizeCampaignAction(id, 'read');
    return campaign;
  } catch (error: any) {
    console.error("Error in getCampaignByIdAction:", error.message);
    if (error.message === "UnauthorizedAccessToPrivateCampaign") {
      redirect("/error/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function createCampaignAction(formData: FormData): Promise<Campaign | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const pathway_template_id = formData.get("pathway_template_id") as string | null;
  const start_date = formData.get("start_date") as string | null;
  const end_date = formData.get("end_date") as string | null;
  const is_public = formData.get("is_public") === "on";
  const status = formData.get("status") as Campaign['status'];
  const config = JSON.parse(formData.get("config") as string || '{}');
  const program_id = formData.get("program_id") as string | null; // Get program_id from form data

  if (!name || !status) {
    throw new Error("Campaign name and status are required.");
  }

  // Additional authorization check for program_id (since RLS is simplified)
  if (program_id) {
    const userRole: string = user.user_metadata?.role || '';
    const isAdmin = userRole === 'admin';
    const program = await getProgramById(program_id); // Use direct function call

    if (!program) {
      throw new Error("Linked program not found.");
    }
    if (!isAdmin && program.creator_id !== user.id) {
      throw new Error("Unauthorized to link campaign to this program.");
    }
  }

  let newCampaign: Campaign | null = null;
  try {
    newCampaign = await createCampaign( // Use the service function
      name,
      description,
      pathway_template_id,
      start_date,
      end_date,
      is_public,
      status,
      config,
      user.id,
      program_id
    );

    // If a pathway template was selected, deep copy its phases to campaign_phases
    if (newCampaign && pathway_template_id) {
      await deepCopyPhasesFromTemplate(newCampaign.id, pathway_template_id); // Use the service function
    }

    revalidatePath("/campaigns");
    if (program_id) {
      revalidatePath(`/programs/${program_id}`);
    }
    return newCampaign;
  } catch (error: any) {
    console.error("Error in createCampaignAction:", error.message);
    // If phase copying fails, consider rolling back campaign creation or logging for manual intervention
    if (newCampaign) {
      // Optionally delete the campaign if phase copying fails
      // await campaignService.deleteCampaign(newCampaign.id);
      console.warn(`Campaign ${newCampaign.id} created but phases failed to copy. Manual intervention may be needed.`);
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function updateCampaignAction(id: string, formData: FormData): Promise<Campaign | null> {
  try {
    const { user, campaign, isAdmin } = await authorizeCampaignAction(id, 'write'); // Authorize before update

    if (!campaign) {
      throw new Error("CampaignNotFound");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const pathway_template_id = formData.get("pathway_template_id") as string | null;
    const start_date = formData.get("start_date") as string | null;
    const end_date = formData.get("end_date") as string | null;
    const is_public = formData.get("is_public") === "on";
    const status = formData.get("status") as Campaign['status'];
    const config = JSON.parse(formData.get("config") as string || '{}');
    const program_id = formData.get("program_id") as string | null; // Get program_id from form data

    if (!name || !status) {
      throw new Error("Campaign name and status are required.");
    }

    // Additional authorization check if program_id is being changed or set
    if (program_id !== campaign.program_id) {
      if (program_id) { // If linking to a new program
        const program = await getProgramById(program_id); // Use direct function call
        if (!program) {
          throw new Error("Linked program not found.");
        }
        if (!isAdmin && program.creator_id !== user.id) {
          throw new Error("Unauthorized to link campaign to this program.");
        }
      } else { // If unlinking from a program
        // No specific check needed, as unlinking is generally allowed if user can modify campaign
      }
    }

    const updatedCampaign = await updateCampaign( // Use the service function
      id,
      { name, description, pathway_template_id, start_date, end_date, is_public, status, config, program_id }
    );

    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${id}`);
    if (campaign.program_id) {
      revalidatePath(`/programs/${campaign.program_id}`);
    }
    if (program_id) {
      revalidatePath(`/programs/${program_id}`);
    }
    return updatedCampaign;
  } catch (error: any) {
    console.error("Error in updateCampaignAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function deleteCampaignAction(id: string): Promise<boolean> {
  try {
    const { campaign } = await authorizeCampaignAction(id, 'write'); // Authorize before delete

    if (!campaign) {
      throw new Error("CampaignNotFound");
    }

    const success = await deleteCampaign(id); // Use the service function

    revalidatePath("/campaigns");
    if (campaign.program_id) {
      revalidatePath(`/programs/${campaign.program_id}`);
    }
    return success;
  } catch (error: any) {
    console.error("Error in deleteCampaignAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

// --- Campaign Phase Management Server Actions ---

export async function getCampaignPhasesAction(campaignId: string): Promise<CampaignPhase[] | null> {
  try {
    await authorizeCampaignAction(campaignId, 'read'); // User must have read access to the parent campaign
    const phases = await getCampaignPhasesByCampaignId(campaignId); // Use the service function
    return phases;
  } catch (error: any) {
    console.error("Error in getCampaignPhasesAction:", error.message);
    if (error.message === "UnauthorizedAccessToPrivateCampaign") {
      redirect("/error/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function createCampaignPhaseAction(campaignId: string, formData: FormData): Promise<CampaignPhase | null> {
  try {
    await authorizeCampaignAction(campaignId, 'write'); // User must have write access to the parent campaign

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    const order_index = parseInt(formData.get("order_index") as string);
    const original_phase_id = formData.get("original_phase_id") as string | null;
    const config = JSON.parse(formData.get("config") as string || '{}');

    if (!name || !type || isNaN(order_index)) {
      throw new Error("Campaign phase name, type, and order index are required.");
    }

    const newPhase = await createCampaignPhase( // Use the service function
      campaignId,
      name,
      type,
      order_index,
      description,
      config,
      original_phase_id
    );

    revalidatePath(`/campaigns/${campaignId}`);
    return newPhase;
  } catch (error: any) {
    console.error("Error in createCampaignPhaseAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error/500");
    }
    throw error; // Re-throw to be caught by client-side toast for form errors
  }
}

export async function updateCampaignPhaseAction(phaseId: string, campaignId: string, formData: FormData): Promise<CampaignPhase | null> {
  try {
    await authorizeCampaignAction(campaignId, 'write'); // User must have write access to the parent campaign

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    const config = JSON.parse(formData.get("config") as string || '{}');

    if (!name || !type) {
      throw new Error("Campaign phase name and type are required.");
    }

    const updatedPhase = await updateCampaignPhaseService( // Use the service function (renamed import)
      phaseId,
      { name, type, description, config }
    );

    revalidatePath(`/campaigns/${campaignId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("Error in updateCampaignPhaseAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function updateCampaignPhaseConfigAction(phaseId: string, campaignId: string, configUpdates: Record<string, any>): Promise<CampaignPhase | null> {
  try {
    await authorizeCampaignAction(campaignId, 'write'); // User must have write access to the parent campaign

    const updatedPhase = await updateCampaignPhaseService( // Use the service function (renamed import)
      phaseId,
      { config: configUpdates }
    );

    revalidatePath(`/campaigns/${campaignId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("Error in updateCampaignPhaseConfigAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function deleteCampaignPhaseAction(phaseId: string, campaignId: string): Promise<boolean> {
  try {
    await authorizeCampaignAction(campaignId, 'write'); // User must have write access to the parent campaign

    const success = await deleteCampaignPhase(phaseId); // Use the service function

    revalidatePath(`/campaigns/${campaignId}`);
    return success;
  } catch (error: any) {
    console.error("Error in deleteCampaignPhaseAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function reorderCampaignPhasesAction(campaignId: string, phases: { id: string; order_index: number }[]): Promise<boolean> {
  try {
    await authorizeCampaignAction(campaignId, 'write'); // User must have write access to the parent campaign

    // Perform updates in a transaction if possible, or sequentially
    for (const phase of phases) {
      await updateCampaignPhaseService(phase.id, { order_index: phase.order_index }); // Use the service function (renamed import)
    }

    revalidatePath(`/campaigns/${campaignId}`);
    return true;
  } catch (error: any) {
    console.error("Error in reorderCampaignPhasesAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}