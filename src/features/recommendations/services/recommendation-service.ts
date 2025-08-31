"use server";

import { createClient } from "@/integrations/supabase/server";
import { Profile } from "@/types/supabase"; // Assuming Profile interface is available

export interface RecommendationRequest {
  id: string;
  application_id: string;
  campaign_phase_id: string; // Added campaign_phase_id
  recommender_email: string;
  recommender_name: string | null;
  unique_token: string;
  status: 'pending' | 'sent' | 'viewed' | 'submitted' | 'overdue';
  request_sent_at: string | null;
  submitted_at: string | null;
  form_data: Record<string, any> | null; // Stores the recommender's submission
  created_at: string;
  updated_at: string;
  applications?: { profiles: Profile; campaigns: { name: string } }; // For joining with applicant's profile via application and campaign name
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

// --- Recommendation Request Management ---

export async function getRecommendationRequests(applicationId?: string): Promise<RecommendationRequest[] | null> {
  const supabase = await getSupabase();
  let query = supabase
    .from("recommendation_requests")
    .select("*, applications(profiles(first_name, last_name, avatar_url), campaigns(name))")
    .order("created_at", { ascending: false });

  if (applicationId) {
    query = query.eq("application_id", applicationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching recommendation requests:", error.message);
    return null;
  }
  return data as RecommendationRequest[];
}

export async function getRecommendationRequestByToken(token: string): Promise<RecommendationRequest | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("recommendation_requests")
    .select("*, applications(profiles(first_name, last_name, avatar_url), campaigns(name))")
    .eq("unique_token", token)
    .single();

  if (error) {
    console.error(`Error fetching recommendation request by token ${token}:`, error.message);
    return null;
  }
  return data as RecommendationRequest;
}

export async function createRecommendationRequest(
  applicationId: string,
  campaignPhaseId: string, // Added campaignPhaseId
  recommenderEmail: string,
  recommenderName: string | null = null,
  uniqueToken: string,
  status: RecommendationRequest['status'] = 'pending'
): Promise<RecommendationRequest | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("recommendation_requests")
    .insert([{
      application_id: applicationId,
      campaign_phase_id: campaignPhaseId, // Added campaign_phase_id
      recommender_email: recommenderEmail,
      recommender_name: recommenderName,
      unique_token: uniqueToken,
      status: status,
      request_sent_at: new Date().toISOString(), // Mark as sent upon creation
    }])
    .select("*, applications(profiles(first_name, last_name, avatar_url), campaigns(name))")
    .single();

  if (error) {
    console.error("Error creating recommendation request:", error.message);
    return null;
  }
  return data as RecommendationRequest;
}

export async function submitRecommendation(
  requestId: string,
  formData: Record<string, any>
): Promise<RecommendationRequest | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("recommendation_requests")
    .update({
      form_data: formData,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select("*, applications(profiles(first_name, last_name, avatar_url), campaigns(name))")
    .single();

  if (error) {
    console.error(`Error submitting recommendation for request ${requestId}:`, error.message);
    return null;
  }
  return data as RecommendationRequest;
}

export async function updateRecommendationRequestStatus(
  requestId: string,
  newStatus: RecommendationRequest['status']
): Promise<RecommendationRequest | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("recommendation_requests")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .select("*, applications(profiles(first_name, last_name, avatar_url), campaigns(name))")
    .single();

  if (error) {
    console.error(`Error updating recommendation request status ${requestId}:`, error.message);
    return null;
  }
  return data as RecommendationRequest;
}