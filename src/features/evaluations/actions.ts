"use server";

import { evaluationService, Review, ReviewerAssignment, Decision } from "./services/evaluation-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Application } from "@/features/applications/services/application-service"; // For authorization checks

// --- Helper Functions for Authorization ---

// Fetches application and checks user's role/ownership for access
async function authorizeApplicationAccessForEvaluation(applicationId: string, action: 'read' | 'write'): Promise<{ user: any; application: Application | null; isAdmin: boolean; isCampaignCreator: boolean }> {
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
      .select("*, campaigns(creator_id, is_public)")
      .eq("id", applicationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
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

  const isApplicant = user.id === application?.applicant_id;
  const isCampaignCreator = user.id === application?.campaigns?.creator_id;
  const isPublicCampaign = application?.campaigns?.is_public;

  if (action === 'read') {
    if (!isAdmin && !isApplicant && !isCampaignCreator && !isPublicCampaign) {
      throw new Error("UnauthorizedAccessToApplication");
    }
  } else if (action === 'write') {
    if (!isAdmin && !isCampaignCreator) { // Only admin or campaign creator can write to evaluation-related data
      throw new Error("UnauthorizedToModifyEvaluationData");
    }
  }

  return { user, application, isAdmin, isCampaignCreator };
}

// --- Reviewer Assignment Actions ---

export async function getReviewerAssignmentsAction(campaignPhaseId?: string, reviewerId?: string): Promise<ReviewerAssignment[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // RLS policies on `reviewer_assignments` table handle the primary authorization.
  // This action primarily serves to fetch data for the authenticated user.
  try {
    const assignments = await evaluationService.getReviewerAssignments(campaignPhaseId, reviewerId);
    return assignments;
  } catch (error: any) {
    console.error("Error in getReviewerAssignmentsAction:", error.message);
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function createReviewerAssignmentAction(formData: FormData): Promise<ReviewerAssignment | null> {
  const applicationId = formData.get("application_id") as string;
  const reviewerId = formData.get("reviewer_id") as string;
  const campaignPhaseId = formData.get("campaign_phase_id") as string;
  const status = formData.get("status") as ReviewerAssignment['status'] || 'assigned';

  if (!applicationId || !reviewerId || !campaignPhaseId) {
    throw new Error("Application ID, Reviewer ID, and Campaign Phase ID are required for assignment.");
  }

  try {
    // Authorize: Only admin or campaign creator can create assignments
    await authorizeApplicationAccessForEvaluation(applicationId, 'write');

    const newAssignment = await evaluationService.createReviewerAssignment(
      applicationId,
      reviewerId,
      campaignPhaseId,
      status
    );
    revalidatePath(`/workbench/applications/${applicationId}`);
    revalidatePath(`/workbench/evaluations/assignments`); // Revalidate assignments list
    return newAssignment;
  } catch (error: any) {
    console.error("Error in createReviewerAssignmentAction:", error.message);
    throw error;
  }
}

export async function updateReviewerAssignmentAction(id: string, formData: FormData): Promise<ReviewerAssignment | null> {
  const status = formData.get("status") as ReviewerAssignment['status'];
  const completed_at = formData.get("completed_at") as string | null;

  if (!status) {
    throw new Error("Status is required for updating assignment.");
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect("/login");
    }

    // Fetch assignment to get application_id for authorization
    const { data: assignment, error: fetchError } = await supabase
      .from("reviewer_assignments")
      .select("application_id, reviewer_id")
      .eq("id", id)
      .single();

    if (fetchError || !assignment) {
      throw new Error("ReviewerAssignmentNotFound");
    }

    // Authorize: Reviewer can update their own assignment status, Admin/Campaign Creator can update any
    const { isAdmin, isCampaignCreator } = await authorizeApplicationAccessForEvaluation(assignment.application_id, 'write');
    const isReviewer = user.id === assignment.reviewer_id;

    if (!isAdmin && !isCampaignCreator && !isReviewer) {
      throw new Error("UnauthorizedToModifyReviewerAssignment");
    }

    const updates: Partial<ReviewerAssignment> = { status };
    if (completed_at !== undefined) {
      updates.completed_at = completed_at;
    }

    const updatedAssignment = await evaluationService.updateReviewerAssignment(id, updates);
    revalidatePath(`/workbench/applications/${assignment.application_id}`);
    revalidatePath(`/workbench/evaluations/assignments`);
    return updatedAssignment;
  } catch (error: any) {
    console.error("Error in updateReviewerAssignmentAction:", error.message);
    throw error;
  }
}

export async function deleteReviewerAssignmentAction(id: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect("/login");
    }

    // Fetch assignment to get application_id for authorization
    const { data: assignment, error: fetchError } = await supabase
      .from("reviewer_assignments")
      .select("application_id")
      .eq("id", id)
      .single();

    if (fetchError || !assignment) {
      throw new Error("ReviewerAssignmentNotFound");
    }

    // Authorize: Only admin or campaign creator can delete assignments
    await authorizeApplicationAccessForEvaluation(assignment.application_id, 'write');

    const success = await evaluationService.deleteReviewerAssignment(id);
    revalidatePath(`/workbench/applications/${assignment.application_id}`);
    revalidatePath(`/workbench/evaluations/assignments`);
    return success;
  } catch (error: any) {
    console.error("Error in deleteReviewerAssignmentAction:", error.message);
    throw error;
  }
}

// --- Review Actions ---

export async function getReviewsAction(applicationId?: string, reviewerId?: string, campaignPhaseId?: string): Promise<Review[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // RLS policies on `reviews` table handle the primary authorization.
  try {
    const reviews = await evaluationService.getReviews(applicationId, reviewerId, campaignPhaseId);
    return reviews;
  } catch (error: any) {
    console.error("Error in getReviewsAction:", error.message);
    throw error;
  }
}

export async function createReviewAction(formData: FormData): Promise<Review | null> {
  const applicationId = formData.get("application_id") as string;
  const reviewerId = formData.get("reviewer_id") as string;
  const campaignPhaseId = formData.get("campaign_phase_id") as string;
  const score = JSON.parse(formData.get("score") as string || '{}');
  const comments = formData.get("comments") as string | null;
  const status = formData.get("status") as Review['status'] || 'pending';

  if (!applicationId || !reviewerId || !campaignPhaseId) {
    throw new Error("Application ID, Reviewer ID, and Campaign Phase ID are required for review.");
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect("/login");
    }

    // Authorize: Only the assigned reviewer or an admin can create a review
    // RLS handles this, but we can add an extra check here for clarity/early exit
    if (user.id !== reviewerId && user.user_metadata?.role !== 'admin') {
      throw new Error("UnauthorizedToCreateReview");
    }

    const newReview = await evaluationService.createReview(
      applicationId,
      reviewerId,
      campaignPhaseId,
      score,
      comments,
      status
    );
    revalidatePath(`/workbench/applications/${applicationId}`);
    revalidatePath(`/workbench/evaluations/my-reviews`); // Revalidate reviewer's dashboard
    return newReview;
  } catch (error: any) {
    console.error("Error in createReviewAction:", error.message);
    throw error;
  }
}

export async function updateReviewAction(id: string, formData: FormData): Promise<Review | null> {
  const score = formData.get("score") ? JSON.parse(formData.get("score") as string) : undefined;
  const comments = formData.get("comments") as string | null | undefined;
  const status = formData.get("status") as Review['status'] | undefined;

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect("/login");
    }

    // Fetch review to get reviewer_id and application_id for authorization
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("reviewer_id, application_id")
      .eq("id", id)
      .single();

    if (fetchError || !review) {
      throw new Error("ReviewNotFound");
    }

    // Authorize: Only the reviewer or an admin can update their review
    if (user.id !== review.reviewer_id && user.user_metadata?.role !== 'admin') {
      throw new Error("UnauthorizedToUpdateReview");
    }

    const updates: Partial<Review> = {};
    if (score !== undefined) updates.score = score;
    if (comments !== undefined) updates.comments = comments;
    if (status !== undefined) updates.status = status;

    const updatedReview = await evaluationService.updateReview(id, updates);
    revalidatePath(`/workbench/applications/${review.application_id}`);
    revalidatePath(`/workbench/evaluations/my-reviews`);
    return updatedReview;
  } catch (error: any) {
    console.error("Error in updateReviewAction:", error.message);
    throw error;
  }
}

export async function deleteReviewAction(id: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect("/login");
    }

    // Fetch review to get reviewer_id and application_id for authorization
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("reviewer_id, application_id")
      .eq("id", id)
      .single();

    if (fetchError || !review) {
      throw new Error("ReviewNotFound");
    }

    // Authorize: Only the reviewer or an admin can delete their review
    if (user.id !== review.reviewer_id && user.user_metadata?.role !== 'admin') {
      throw new Error("UnauthorizedToDeleteReview");
    }

    const success = await evaluationService.deleteReview(id);
    revalidatePath(`/workbench/applications/${review.application_id}`);
    revalidatePath(`/workbench/evaluations/my-reviews`);
    return success;
  } catch (error: any) {
    console.error("Error in deleteReviewAction:", error.message);
    throw error;
  }
}

// --- Decision Actions ---

export async function getDecisionsAction(applicationId?: string, campaignPhaseId?: string): Promise<Decision[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // RLS policies on `decisions` table handle the primary authorization.
  try {
    const decisions = await evaluationService.getDecisions(applicationId, campaignPhaseId);
    return decisions;
  } catch (error: any) {
    console.error("Error in getDecisionsAction:", error.message);
    throw error;
  }
}

export async function createDecisionAction(formData: FormData): Promise<Decision | null> {
  const applicationId = formData.get("application_id") as string;
  const campaignPhaseId = formData.get("campaign_phase_id") as string;
  const deciderId = formData.get("decider_id") as string;
  const outcome = formData.get("outcome") as string;
  const notes = formData.get("notes") as string | null;
  const isFinal = formData.get("is_final") === "on";

  if (!applicationId || !campaignPhaseId || !deciderId || !outcome) {
    throw new Error("Application ID, Campaign Phase ID, Decider ID, and Outcome are required for decision.");
  }

  try {
    // Authorize: Only admin or campaign creator can create decisions
    await authorizeApplicationAccessForEvaluation(applicationId, 'write');

    const newDecision = await evaluationService.createDecision(
      applicationId,
      campaignPhaseId,
      deciderId,
      outcome,
      notes,
      isFinal
    );
    revalidatePath(`/workbench/applications/${applicationId}`);
    revalidatePath(`/workbench/evaluations/decisions`); // Revalidate decisions list
    return newDecision;
  } catch (error: any) {
    console.error("Error in createDecisionAction:", error.message);
    throw error;
  }
}

export async function updateDecisionAction(id: string, formData: FormData): Promise<Decision | null> {
  const outcome = formData.get("outcome") as string | undefined;
  const notes = formData.get("notes") as string | null | undefined;
  const isFinal = formData.get("is_final") === "on" ? true : (formData.has("is_final") ? false : undefined);

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect("/login");
    }

    // Fetch decision to get application_id for authorization
    const { data: decision, error: fetchError } = await supabase
      .from("decisions")
      .select("application_id")
      .eq("id", id)
      .single();

    if (fetchError || !decision) {
      throw new Error("DecisionNotFound");
    }

    // Authorize: Only admin or campaign creator can update decisions
    await authorizeApplicationAccessForEvaluation(decision.application_id, 'write');

    const updates: Partial<Decision> = {};
    if (outcome !== undefined) updates.outcome = outcome;
    if (notes !== undefined) updates.notes = notes;
    if (isFinal !== undefined) updates.is_final = isFinal;

    const updatedDecision = await evaluationService.updateDecision(id, updates);
    revalidatePath(`/workbench/applications/${decision.application_id}`);
    revalidatePath(`/workbench/evaluations/decisions`);
    return updatedDecision;
  } catch (error: any) {
    console.error("Error in updateDecisionAction:", error.message);
    throw error;
  }
}

export async function deleteDecisionAction(id: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect("/login");
    }

    // Fetch decision to get application_id for authorization
    const { data: decision, error: fetchError } = await supabase
      .from("decisions")
      .select("application_id")
      .eq("id", id)
      .single();

    if (fetchError || !decision) {
      throw new Error("DecisionNotFound");
    }

    // Authorize: Only admin or campaign creator can delete decisions
    await authorizeApplicationAccessForEvaluation(decision.application_id, 'write');

    const success = await evaluationService.deleteDecision(id);
    revalidatePath(`/workbench/applications/${decision.application_id}`);
    revalidatePath(`/workbench/evaluations/decisions`);
    return success;
  } catch (error: any) {
    console.error("Error in deleteDecisionAction:", error.message);
    throw error;
  }
}