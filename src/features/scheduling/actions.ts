"use server";

import {
  HostAvailability,
  ScheduledInterview,
  getHostAvailabilities,
  createHostAvailability,
  updateHostAvailability,
  deleteHostAvailability,
  getScheduledInterviews,
  getAvailableSlots,
  bookInterview,
  cancelInterview,
} from "@/features/scheduling/services/scheduling-service"; // Fixed import path
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApplicationById } from "@/features/applications/services/application-service"; // To get applicant_id and campaign_id details

// Helper function to check user authorization for scheduling actions
async function authorizeSchedulingAction(action: 'read' | 'write' | 'book_interview' | 'cancel_interview', entityId?: string): Promise<{ user: any; isAdmin: boolean; isHost: boolean; isApplicant: boolean; isCampaignCreator: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';
  const isHost = userRole === 'host' || isAdmin; // Admins can also be considered hosts for management
  const isApplicant = userRole === 'applicant' || isAdmin; // Admins can also be considered applicants for management
  let isCampaignCreator = false;

  if (entityId && (action === 'book_interview' || action === 'cancel_interview')) {
    // For booking/canceling, entityId is application_id
    const application = await getApplicationById(entityId);
    if (application && application.campaigns?.creator_id === user.id) {
      isCampaignCreator = true;
    }
  }

  if (action === 'write' && !isHost) { // Only hosts or admins can create/update/delete availabilities
    throw new Error("UnauthorizedToModifyAvailability");
  }
  if (action === 'book_interview' && !isApplicant) { // Only applicants or admins can book interviews
    throw new Error("UnauthorizedToBookInterview");
  }
  if (action === 'cancel_interview') {
    // For canceling, check if user is applicant, host, admin, or campaign creator
    if (!isApplicant && !isHost && !isAdmin && !isCampaignCreator) {
      throw new Error("UnauthorizedToCancelInterview");
    }
  }
  // For read, RLS handles most cases, but this ensures user is authenticated.

  return { user, isAdmin, isHost, isApplicant, isCampaignCreator };
}

// --- Host Availability Server Actions ---

export async function getHostAvailabilitiesAction(userId?: string): Promise<HostAvailability[] | null> {
  try {
    const { user, isAdmin } = await authorizeSchedulingAction('read');
    // If no specific userId is requested, and the current user is not an admin,
    // only return their own availabilities.
    const targetUserId = (userId && isAdmin) ? userId : user.id;

    const availabilities = await getHostAvailabilities(targetUserId);
    return availabilities;
  } catch (error: any) {
    console.error("Error in getHostAvailabilitiesAction:", error.message);
    if (error.message === "UnauthorizedToModifyAvailability") {
      redirect("/error/403");
    }
    redirect("/login"); // Fallback
  }
}

export async function createHostAvailabilityAction(formData: FormData): Promise<HostAvailability | null> {
  try {
    const { user, isAdmin } = await authorizeSchedulingAction('write');

    const start_time = formData.get("start_time") as string;
    const end_time = formData.get("end_time") as string;
    const is_available = formData.get("is_available") === "on";
    const target_user_id = formData.get("user_id") as string || user.id; // Allow admin to create for others

    if (!start_time || !end_time) {
      throw new Error("Start and end times are required.");
    }

    // Ensure non-admins can only create for themselves
    if (!isAdmin && target_user_id !== user.id) {
      throw new Error("UnauthorizedToCreateAvailabilityForOtherUser");
    }

    const newAvailability = await createHostAvailability(
      target_user_id,
      start_time,
      end_time,
      is_available
    );

    revalidatePath("/scheduling"); // Revalidate the scheduling dashboard
    return newAvailability;
  } catch (error: any) {
    console.error("Error in createHostAvailabilityAction:", error.message);
    if (error.message === "UnauthorizedToModifyAvailability" || error.message === "UnauthorizedToCreateAvailabilityForOtherUser") {
      redirect("/error/403");
    }
    throw error; // Re-throw for client-side toast
  }
}

export async function updateHostAvailabilityAction(id: string, formData: FormData): Promise<HostAvailability | null> {
  try {
    await authorizeSchedulingAction('write'); // Authorize deletion

    const start_time = formData.get("start_time") as string | undefined;
    const end_time = formData.get("end_time") as string | undefined;
    const is_available = formData.get("is_available") === "on" ? true : (formData.has("is_available") ? false : undefined);

    const updates: Partial<HostAvailability> = {};
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (is_available !== undefined) updates.is_available = is_available;

    // RLS handles ownership check for update, but we ensure user is authorized to write.
    const updatedAvailability = await updateHostAvailability(id, updates);

    revalidatePath("/scheduling");
    return updatedAvailability;
  } catch (error: any) {
    console.error("Error in updateHostAvailabilityAction:", error.message);
    if (error.message === "UnauthorizedToModifyAvailability") {
      redirect("/error/403");
    }
    throw error; // Re-throw for client-side toast
  }
}

export async function deleteHostAvailabilityAction(id: string): Promise<boolean> {
  try {
    await authorizeSchedulingAction('write'); // Authorize deletion

    // RLS handles ownership check for delete.
    const success = await deleteHostAvailability(id);

    revalidatePath("/scheduling");
    return success;
  } catch (error: any) {
    console.error("Error in deleteHostAvailabilityAction:", error.message);
    if (error.message === "UnauthorizedToModifyAvailability") {
      redirect("/error/403");
    }
    throw error; // Re-throw for client-side toast
  }
}

// --- Scheduled Interviews Server Actions ---

export async function getScheduledInterviewsAction(applicationId?: string, hostId?: string, applicantId?: string): Promise<ScheduledInterview[] | null> {
  try {
    const { user, isAdmin, isHost, isApplicant, isCampaignCreator } = await authorizeSchedulingAction('read');

    // If no specific ID is provided, and user is not admin/host/campaign creator,
    // default to fetching interviews for the current applicant.
    let finalApplicantId = applicantId;
    let finalHostId = hostId;

    if (!isAdmin && !isHost && !isCampaignCreator) {
      // If not an admin, host, or campaign creator, assume they are an applicant
      finalApplicantId = user.id;
    } else if (!isAdmin && !isApplicant && !isCampaignCreator) {
      // If not an admin, applicant, or campaign creator, assume they are a host
      finalHostId = user.id;
    }

    const interviews = await getScheduledInterviews(applicationId, finalHostId, finalApplicantId);
    return interviews;
  } catch (error: any) {
    console.error("Error in getScheduledInterviewsAction:", error.message);
    redirect("/login"); // Fallback
  }
}

export async function getAvailableSlotsAction(campaignPhaseId: string, date: string): Promise<HostAvailability[] | null> {
  try {
    await authorizeSchedulingAction('read'); // Basic read authorization
    const slots = await getAvailableSlots(campaignPhaseId, date);
    return slots;
  } catch (error: any) {
    console.error("Error in getAvailableSlotsAction:", error.message);
    redirect("/login"); // Fallback
  }
}

export async function bookInterviewAction(formData: FormData): Promise<ScheduledInterview | null> {
  const applicationId = formData.get("application_id") as string;
  const campaignPhaseId = formData.get("campaign_phase_id") as string;
  const hostId = formData.get("host_id") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const meetingLink = formData.get("meeting_link") as string | null;

  if (!applicationId || !campaignPhaseId || !hostId || !startTime || !endTime) {
    throw new Error("All interview details are required.");
  }

  try {
    const { user, isApplicant } = await authorizeSchedulingAction('book_interview', applicationId);

    // Ensure the booking is made by the actual applicant or an admin
    const application = await getApplicationById(applicationId);
    if (!application) {
      throw new Error("Application not found.");
    }
    if (!isApplicant && user.id !== application.applicant_id) {
      throw new Error("Unauthorized to book interview for this application.");
    }

    const newInterview = await bookInterview(
      applicationId,
      campaignPhaseId,
      hostId,
      user.id, // Applicant is the current user
      startTime,
      endTime,
      meetingLink
    );

    revalidatePath(`/applications/${applicationId}`);
    revalidatePath("/my-interviews");
    revalidatePath("/scheduling"); // For hosts to see their bookings
    return newInterview;
  } catch (error: any) {
    console.error("Error in bookInterviewAction:", error.message);
    if (error.message === "UnauthorizedToBookInterview") {
      redirect("/error/403");
    }
    throw error; // Re-throw for client-side toast
  }
}

export async function cancelInterviewAction(id: string): Promise<boolean> {
  try {
    const { user, isAdmin, isHost, isApplicant, isCampaignCreator } = await authorizeSchedulingAction('cancel_interview');

    // Fetch the interview to get application_id for revalidation and detailed authorization
    const interviews = await getScheduledInterviews(undefined, undefined, undefined);
    const interview = interviews?.find((i: ScheduledInterview) => i.id === id); // Explicitly type 'i'

    if (!interview) {
      throw new Error("Scheduled interview not found.");
    }

    // Detailed authorization check for cancellation
    if (!isAdmin && !isCampaignCreator && user.id !== interview.applicant_id && user.id !== interview.host_id) {
      throw new Error("Unauthorized to cancel this interview.");
    }

    const success = await cancelInterview(id);

    revalidatePath(`/applications/${interview.application_id}`);
    revalidatePath("/my-interviews");
    revalidatePath("/scheduling"); // For hosts to see changes
    return success;
  } catch (error: any) {
    console.error("Error in cancelInterviewAction:", error.message);
    if (error.message === "UnauthorizedToCancelInterview") {
      redirect("/error/403");
    }
    throw error; // Re-throw for client-side toast
  }
}