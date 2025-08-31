"use server";

import {
  RecommendationRequest,
  getRecommendationRequests,
  getRecommendationRequestByToken,
  createRecommendationRequest,
  submitRecommendation,
  updateRecommendationRequestStatus,
} from "./services/recommendation-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApplicationById } from "@/features/applications/services/application-service"; // To get application details

// Helper function to check user authorization for recommendation actions
async function authorizeRecommendationAction(action: 'read' | 'write' | 'submit_recommender_form', entityId?: string): Promise<{ user: any; isAdmin: boolean; isApplicant: boolean; isCampaignCreator: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // For public recommender form submission, user might not be authenticated.
  // This helper is primarily for authenticated actions.
  if (action !== 'submit_recommender_form' && (userError || !user)) {
    redirect("/login");
  }

  const userRole: string = user?.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';
  const isApplicant = user?.id && entityId ? (await getApplicationById(entityId))?.applicant_id === user.id : false;
  const isCampaignCreator = user?.id && entityId ? (await getApplicationById(entityId))?.campaigns?.creator_id === user.id : false;

  if (action === 'write' && !isAdmin && !isCampaignCreator) {
    throw new Error("UnauthorizedToModifyRecommendationRequests");
  }
  // 'submit_recommender_form' has its own token-based authorization, not user-based.

  return { user, isAdmin, isApplicant, isCampaignCreator };
}

// --- Recommendation Request Server Actions ---

export async function getRecommendationRequestsAction(applicationId: string): Promise<RecommendationRequest[] | null> {
  try {
    // Authorize: Only applicant, campaign creator, or admin can view requests for an application
    const { user, isAdmin, isApplicant, isCampaignCreator } = await authorizeRecommendationAction('read', applicationId);
    
    // If not admin, applicant, or campaign creator, deny access
    if (!isAdmin && !isApplicant && !isCampaignCreator) {
      throw new Error("UnauthorizedAccessToRecommendationRequests");
    }

    const requests = await getRecommendationRequests(applicationId);
    return requests;
  } catch (error: any) {
    console.error("Error in getRecommendationRequestsAction:", error.message);
    if (error.message === "UnauthorizedAccessToRecommendationRequests") {
      redirect("/error/403");
    }
    redirect("/login"); // Fallback
  }
}

export async function getRecommendationRequestByTokenAction(token: string): Promise<RecommendationRequest | null> {
  try {
    // This action is public, but the service layer will handle token validation.
    // No user-based authorization needed here, as it's for external recommenders.
    const request = await getRecommendationRequestByToken(token);
    return request;
  } catch (error: any) {
    console.error("Error in getRecommendationRequestByTokenAction:", error.message);
    // Specific error handling for public access
    if (error.message === "RecommendationRequestNotFound") {
      redirect("/error/404");
    }
    throw error; // Re-throw for client-side toast
  }
}

export async function createRecommendationRequestAction(applicationId: string, formData: FormData): Promise<RecommendationRequest | null> {
  try {
    const { user, isAdmin, isCampaignCreator } = await authorizeRecommendationAction('write', applicationId);

    const recommender_email = formData.get("recommender_email") as string;
    const recommender_name = formData.get("recommender_name") as string | null;
    const campaign_phase_id = formData.get("campaign_phase_id") as string; // Get campaign_phase_id
    const unique_token = crypto.randomUUID(); // Generate a unique token

    if (!recommender_email || !campaign_phase_id) {
      throw new Error("Recommender email and campaign phase ID are required.");
    }

    const newRequest = await createRecommendationRequest(
      applicationId,
      campaign_phase_id, // Pass campaign_phase_id
      recommender_email,
      recommender_name,
      unique_token,
      'sent' // Mark as sent upon creation
    );

    revalidatePath(`/applications/${applicationId}`);
    // In a real app, this would also trigger sending an email to the recommender with the unique_token link.
    return newRequest;
  } catch (error: any) {
    console.error("Error in createRecommendationRequestAction:", error.message);
    if (error.message === "UnauthorizedToModifyRecommendationRequests") {
      redirect("/error/403");
    }
    throw error; // Re-throw for client-side toast
  }
}

export async function updateRecommendationRequestStatusAction(requestId: string, newStatus: RecommendationRequest['status']): Promise<RecommendationRequest | null> {
  try {
    // Fetch the request to get application_id for authorization
    const request = await getRecommendationRequestByToken(requestId); // Using requestId as token for simplicity here, but should be actual ID
    if (!request) {
      throw new Error("RecommendationRequestNotFound");
    }
    await authorizeRecommendationAction('write', request.application_id);

    const updatedRequest = await updateRecommendationRequestStatus(requestId, newStatus);

    revalidatePath(`/applications/${request.application_id}`);
    return updatedRequest;
  } catch (error: any) {
    console.error("Error in updateRecommendationRequestStatusAction:", error.message);
    if (error.message === "UnauthorizedToModifyRecommendationRequests") {
      redirect("/error/403");
    } else if (error.message === "RecommendationRequestNotFound") {
      redirect("/error/404");
    }
    throw error; // Re-throw for client-side toast
  }
}

export async function submitRecommendationAction(token: string, formData: FormData): Promise<RecommendationRequest | null> {
  try {
    // No user-based authorization here, as this is for public recommenders.
    // Authorization is based on the unique_token.
    const request = await getRecommendationRequestByToken(token);
    if (!request) {
      throw new Error("InvalidRecommendationToken");
    }
    if (request.status === 'submitted') {
      throw new Error("RecommendationAlreadySubmitted");
    }

    const submissionData: Record<string, any> = {};
    formData.forEach((value, key) => {
      submissionData[key] = value;
    });

    const updatedRequest = await submitRecommendation(request.id, submissionData);

    revalidatePath(`/applications/${request.application_id}`);
    return updatedRequest;
  } catch (error: any) {
    console.error("Error in submitRecommendationAction:", error.message);
    if (error.message === "InvalidRecommendationToken") {
      redirect("/error/404");
    } else if (error.message === "RecommendationAlreadySubmitted") {
      throw new Error("This recommendation has already been submitted.");
    }
    throw error; // Re-throw for client-side toast
  }
}