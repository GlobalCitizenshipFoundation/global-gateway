"use server";

import { createClient } from "@/integrations/supabase/server";
import { Profile } from "@/types/supabase"; // Assuming Profile interface is available

export interface HostAvailability {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile; // For joining with host's profile
}

export interface ScheduledInterview {
  id: string;
  application_id: string;
  campaign_phase_id: string;
  host_id: string;
  applicant_id: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
  status: 'booked' | 'canceled' | 'completed';
  created_at: string;
  updated_at: string;
  profiles?: Profile; // For joining with host's profile
  applications?: { profiles: Profile; campaigns: { name: string } }; // For joining with applicant's profile via application and campaign name
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

// --- Host Availability Management ---

export async function getHostAvailabilities(userId?: string): Promise<HostAvailability[] | null> {
  const supabase = await getSupabase();
  let query = supabase
    .from("host_availabilities")
    .select("*, profiles(first_name, last_name, avatar_url)")
    .order("start_time", { ascending: true });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching host availabilities:", error.message);
    return null;
  }
  return data as HostAvailability[];
}

export async function createHostAvailability(
  userId: string,
  startTime: string,
  endTime: string,
  isAvailable: boolean = true
): Promise<HostAvailability | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("host_availabilities")
    .insert([{ user_id: userId, start_time: startTime, end_time: endTime, is_available: isAvailable }])
    .select("*, profiles(first_name, last_name, avatar_url)")
    .single();

  if (error) {
    console.error("Error creating host availability:", error.message);
    return null;
  }
  return data as HostAvailability;
}

export async function updateHostAvailability(
  id: string,
  updates: Partial<Omit<HostAvailability, "id" | "user_id" | "created_at">>
): Promise<HostAvailability | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("host_availabilities")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, profiles(first_name, last_name, avatar_url)")
    .single();

  if (error) {
    console.error(`Error updating host availability ${id}:`, error.message);
    return null;
  }
  return data as HostAvailability;
}

export async function deleteHostAvailability(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("host_availabilities")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting host availability ${id}:`, error.message);
    return false;
  }
  return true;
}

// --- Scheduled Interviews Management ---

export async function getScheduledInterviews(applicationId?: string, hostId?: string, applicantId?: string): Promise<ScheduledInterview[] | null> {
  const supabase = await getSupabase();
  let query = supabase
    .from("scheduled_interviews")
    .select("*, profiles!scheduled_interviews_host_id_fkey(first_name, last_name, avatar_url), applications(profiles(first_name, last_name, avatar_url), campaigns(name))")
    .order("start_time", { ascending: true });

  if (applicationId) {
    query = query.eq("application_id", applicationId);
  }
  if (hostId) {
    query = query.eq("host_id", hostId);
  }
  if (applicantId) {
    query = query.eq("applicant_id", applicantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching scheduled interviews:", error.message);
    return null;
  }
  return data as ScheduledInterview[];
}

export async function getAvailableSlots(campaignPhaseId: string, date: string): Promise<HostAvailability[] | null> {
  const supabase = await getSupabase();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // In a real application, this would involve more complex logic:
  // 1. Fetch hosts assigned to this campaignPhaseId (from phase config or reviewer assignments)
  // 2. Fetch their availabilities
  // 3. Filter out slots that are already booked
  // For now, we'll fetch all available slots for all hosts for the given day.
  const { data, error } = await supabase
    .from("host_availabilities")
    .select("*, profiles(first_name, last_name, avatar_url)")
    .eq("is_available", true)
    .gte("start_time", startOfDay.toISOString())
    .lte("end_time", endOfDay.toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching available slots:", error.message);
    return null;
  }
  return data as HostAvailability[];
}


export async function bookInterview(
  applicationId: string,
  campaignPhaseId: string,
  hostId: string,
  applicantId: string,
  startTime: string,
  endTime: string,
  meetingLink: string | null = null
): Promise<ScheduledInterview | null> {
  const supabase = await getSupabase();

  // Basic check for overlapping appointments for the host
  const { data: hostConflicts, error: hostConflictError } = await supabase
    .from('scheduled_interviews')
    .select('id')
    .eq('host_id', hostId)
    .eq('status', 'booked')
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`); // Correct overlap check
  
  if (hostConflictError) {
    console.error("Error checking host conflicts:", hostConflictError.message);
    throw new Error("Failed to check host availability.");
  }
  if (hostConflicts && hostConflicts.length > 0) {
    throw new Error("Host is already booked during this time slot.");
  }

  // Basic check for overlapping appointments for the applicant
  const { data: applicantConflicts, error: applicantConflictError } = await supabase
    .from('scheduled_interviews')
    .select('id')
    .eq('applicant_id', applicantId)
    .eq('status', 'booked')
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`); // Correct overlap check
  
  if (applicantConflictError) {
    console.error("Error checking applicant conflicts:", applicantConflictError.message);
    throw new Error("Failed to check applicant schedule.");
  }
  if (applicantConflicts && applicantConflicts.length > 0) {
    throw new Error("Applicant already has another interview booked during this time slot.");
  }

  // Generate a placeholder meeting link if not provided
  const finalMeetingLink = meetingLink || `https://meet.globalgateway.org/${Math.random().toString(36).substring(2, 15)}`;

  const { data, error } = await supabase
    .from("scheduled_interviews")
    .insert([{
      application_id: applicationId,
      campaign_phase_id: campaignPhaseId,
      host_id: hostId,
      applicant_id: applicantId,
      start_time: startTime,
      end_time: endTime,
      meeting_link: finalMeetingLink,
      status: 'booked',
    }])
    .select("*, profiles!scheduled_interviews_host_id_fkey(first_name, last_name, avatar_url), applications(profiles(first_name, last_name, avatar_url), campaigns(name))")
    .single();

  if (error) {
    console.error("Error booking interview:", error.message);
    return null;
  }
  return data as ScheduledInterview;
}

export async function cancelInterview(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("scheduled_interviews")
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "booked") // Only cancel if currently booked
    .select()
    .single();

  if (error) {
    console.error(`Error canceling interview ${id}:`, error.message);
    return false;
  }
  if (!data) {
    console.warn(`Attempted to cancel interview ${id} but it was not in 'booked' status or not found.`);
    return false;
  }
  return true;
}