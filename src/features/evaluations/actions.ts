"use server";

import {
  Review,
  ReviewerAssignment,
  Decision,
  getReviewerAssignments,
  createReviewerAssignment,
  updateReviewerAssignment,
  deleteReviewerAssignment,
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  getDecisions,
  createDecision,
  updateDecision,
  deleteDecision,
} from "./services/evaluation-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApplicationById } from "@/features/applications/services/application-service"; // For authorization checks

// --- Helper Functions for Authorization ---

// Fetches application and checks user's role/ownership for access
async function authorizeApplicationAccessForEvaluation(applicationId: string, action: 'read' | 'write'): Promise<{ user: any; application: any | null; isAdmin: boolean; isCampaignCreator: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let application: any | null = null;
  if (applicationId) {
    // Use the service function to fetch the application
    application = await getApplicationById(applicationId);
    if (!application) {
      throw new Error("ApplicationNotFound");
    }
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
    const assignments = await getReviewerAssignments(campaignPhaseId, reviewerId); // Use the service function
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

    const newAssignment = await createReviewerAssignment( // Use the service function
      applicationId,
      reviewerId,
      campaignPhaseId,
      status
    );
    revalidatePath(`/applications/${applicationId}`);
    revalidatePath(`/evaluations/assignments`);
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
    const assignments = await getReviewerAssignments(undefined, undefined); // Fetch all to find by ID
    const assignment = assignments?.find(a => a.id === id);

    if (!assignment) {
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

    const updatedAssignment = await updateReviewerAssignment(id, updates); // Use the service function
    revalidatePath(`/applications/${assignment.application_id}`);
    revalidatePath(`/evaluations/assignments`);
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
    const assignments = await getReviewerAssignments(undefined, undefined); // Fetch all to find by ID
    const assignment = assignments?.find(a => a.id === id);

    if (!assignment) {
      throw new Error("ReviewerAssignmentNotFound");
    }

    // Authorize: Only admin or campaign creator can delete assignments
    await authorizeApplicationAccessForEvaluation(assignment.application_id, 'write');

    const success = await deleteReviewerAssignment(id); // Use the service function
    revalidatePath(`/applications/${assignment.application_id}`);
    revalidatePath(`/evaluations/assignments`);
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
    const reviews = await getReviews(applicationId, reviewerId, campaignPhaseId); // Use the service function
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

    const newReview = await createReview( // Use the service function
      applicationId,
      reviewerId,
      campaignPhaseId,
      score,
      comments,
      status
    );
    revalidatePath(`/applications/${applicationId}`);
    revalidatePath(`/evaluations/my-reviews`);
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
    const reviews = await getReviews(undefined, undefined, undefined); // Fetch all to find by ID
    const review = reviews?.find(r => r.id === id);

    if (!review) {
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

    const updatedReview = await updateReview(id, updates); // Use the service function
    revalidatePath(`/applications/${review.application_id}`);
    revalidatePath(`/evaluations/my-reviews`);
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
    const reviews = await getReviews(undefined, undefined, undefined); // Fetch all to find by ID
    const review = reviews?.find(r => r.id === id);

    if (!review) {
      throw new Error("ReviewNotFound");
    }

    // Authorize: Only the reviewer or an admin can delete their review
    if (user.id !== review.reviewer_id && user.user_metadata?.role !== 'admin') {
      throw new Error("UnauthorizedToDeleteReview");
    }

    const success = await deleteReview(id); // Use the service function
    revalidatePath(`/applications/${review.application_id}`);
    revalidatePath(`/evaluations/my-reviews`);
    return success;
  } catch (error: any) {
    console.error("Error in deleteReviewAction:", error.message);
    if (error.message === "UnauthorizedToDeleteReview") {
      redirect("/error/403");
    } else if (error.message === "ReviewNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveReview") {
      redirect("/error/500");
    }
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
    const decisions = await getDecisions(applicationId, campaignPhaseId); // Use the service function
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

    const newDecision = await createDecision( // Use the service function
      applicationId,
      campaignPhaseId,
      deciderId,
      outcome,
      notes,
      isFinal
    );
    revalidatePath(`/applications/${applicationId}`);
    revalidatePath(`/evaluations/decisions`);
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
    const decisions = await getDecisions(undefined, undefined); // Fetch all to find by ID
    const decision = decisions?.find(d => d.id === id);

    if (!decision) {
      throw new Error("DecisionNotFound");
    }

    // Authorize: Only admin or campaign creator can update decisions
    await authorizeApplicationAccessForEvaluation(decision.application_id, 'write');

    const updates: Partial<Decision> = {};
    if (outcome !== undefined) updates.outcome = outcome;
    if (notes !== undefined) updates.notes = notes;
    if (isFinal !== undefined) updates.is_final = isFinal;

    const updatedDecision = await updateDecision(id, updates); // Use the service function
    revalidatePath(`/applications/${decision.application_id}`);
    revalidatePath(`/evaluations/decisions`);
    return updatedDecision;
  } catch (error: any) {
    console.error("Error in updateDecisionAction:", error.message);
    if (error.message === "UnauthorizedToModifyDecision") {
      redirect("/error/403");
    } else if (error.message === "DecisionNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveDecision") {
      redirect("/error/500");
    }
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
    const decisions = await getDecisions(undefined, undefined); // Fetch all to find by ID
    const decision = decisions?.find(d => d.id === id);

    if (!decision) {
      throw new Error("DecisionNotFound");
    }

    // Authorize: Only admin or campaign creator can delete decisions
    await authorizeApplicationAccessForEvaluation(decision.application_id, 'write');

    const success = await deleteDecision(id); // Use the service function
    revalidatePath(`/applications/${decision.application_id}`);
    revalidatePath(`/evaluations/decisions`);
    return success;
  } catch (error: any) {
    console.error("Error in deleteDecisionAction:", error.message);
    if (error.message === "UnauthorizedToModifyDecision") {
      redirect("/error/403");
    } else if (error.message === "DecisionNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveDecision") {
      redirect("/error/500");
    }
    throw error;
  }
}