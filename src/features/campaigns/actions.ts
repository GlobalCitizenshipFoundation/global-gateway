"use server";

import { campaignService, Campaign } from "@/features/campaigns/services/campaign-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found for eq filter
        throw new Error("CampaignNotFound");
      }
      console.error(`Error fetching campaign ${campaignId} for authorization:`, error.message);
      throw new Error("FailedToRetrieveCampaign");
    }
    campaign = data;
  }

  if (!campaign && campaignId) {
    throw new Error("CampaignNotFound");
  }

  if (action === 'read') {
    if (!isAdmin && campaign && campaign.is_public === false && campaign.creator_id !== user.id) {
      throw new Error("UnauthorizedAccessToPrivateCampaign");
    }
  } else if (action === 'write') { // For 'write' actions (update, delete)
    if (!isAdmin && campaign && campaign.creator_id !== user.id) {
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

  const { data, error } = await supabase
    .from("campaigns")
    .select("*, pathway_templates(id, name, description, is_private)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching campaigns:", error.message);
    return null;
  }

  const filteredData = data.filter(campaign => isAdmin || campaign.creator_id === user.id || campaign.is_public);
  return filteredData as Campaign[];
}

export async function getCampaignByIdAction(id: string): Promise<Campaign | null> {
  try {
    const { campaign } = await authorizeCampaignAction(id, 'read');
    return campaign;
  } catch (error: any) {
    console.error("Error in getCampaignByIdAction:", error.message);
    if (error.message === "UnauthorizedAccessToPrivateCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
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
  const config = JSON.parse(formData.get("config") as string || '{}'); // Ensure config is parsed

  if (!name || !status) {
    throw new Error("Campaign name and status are required.");
  }

  const newCampaign = await campaignService.createCampaign(
    name,
    description,
    pathway_template_id,
    start_date,
    end_date,
    is_public,
    status,
    config,
    user.id
  );

  revalidatePath("/workbench/campaigns");
  return newCampaign;
}

export async function updateCampaignAction(id: string, formData: FormData): Promise<Campaign | null> {
  try {
    await authorizeCampaignAction(id, 'write'); // Authorize before update

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const pathway_template_id = formData.get("pathway_template_id") as string | null;
    const start_date = formData.get("start_date") as string | null;
    const end_date = formData.get("end_date") as string | null;
    const is_public = formData.get("is_public") === "on";
    const status = formData.get("status") as Campaign['status'];
    const config = JSON.parse(formData.get("config") as string || '{}');

    if (!name || !status) {
      throw new Error("Campaign name and status are required.");
    }

    const updatedCampaign = await campaignService.updateCampaign(
      id,
      { name, description, pathway_template_id, start_date, end_date, is_public, status, config }
    );

    revalidatePath("/workbench/campaigns");
    revalidatePath(`/workbench/campaigns/${id}`);
    return updatedCampaign;
  } catch (error: any) {
    console.error("Error in updateCampaignAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function deleteCampaignAction(id: string): Promise<boolean> {
  try {
    await authorizeCampaignAction(id, 'write'); // Authorize before delete

    const success = await campaignService.deleteCampaign(id);

    revalidatePath("/workbench/campaigns");
    return success;
  } catch (error: any) {
    console.error("Error in deleteCampaignAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}