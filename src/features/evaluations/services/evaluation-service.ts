"use server"; // Changed to server-only

import { createClient } from "@/integrations/supabase/server"; // Changed to server-side client
import { toast } from "sonner"; // Keep toast for client-side calls, but remove from server-only functions
import { Application } from "@/features/applications/services/application-service";
import { CampaignPhase } from "@/features/campaigns/services/campaign-service";
import { Profile } from "@/types/supabase";

export interface Review {
  id: string;
  application_id: string;
  reviewer_id: string;
  campaign_phase_id: string;
  score: Record<string, any>; // JSONB for rubric scores
  comments: string | null;
  status: 'pending' | 'submitted' | 'reopened';
  created_at: string;
  updated_at: string;
  applications?: Application; // Joined data
  campaign_phases?: CampaignPhase; // Joined data
  profiles?: Profile; // Reviewer profile
}

export interface ReviewerAssignment {
  id: string;
  application_id: string;
  reviewer_id: string;
  campaign_phase_id: string;
  status: 'assigned' | 'accepted' | 'declined' | 'completed';
  assigned_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  applications?: Application; // Joined data
  campaign_phases?: CampaignPhase; // Joined data
  profiles?: Profile; // Reviewer profile
}

export interface Decision {
  id: string;
  application_id: string;
  campaign_phase_id: string;
  decider_id: string;
  outcome: string; // e.g., 'Accepted', 'Rejected', 'Waitlist'
  notes: string | null;
  is_final: boolean;
  created_at: string;
  updated_at: string;
  applications?: Application; // Joined data
  campaign_phases?: CampaignPhase; // Joined data
  profiles?: Profile; // Decider profile
}

export const evaluationService = {
  // Supabase client is now created on demand for server-side operations
  async getSupabase() {
    return await createClient();
  },

  // --- Reviewer Assignments ---
  async getReviewerAssignments(campaignPhaseId?: string, reviewerId?: string): Promise<ReviewerAssignment[] | null> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from("reviewer_assignments")
      .select("*, applications(*, profiles(first_name, last_name, avatar_url)), campaign_phases(*), profiles!reviewer_assignments_reviewer_id_fkey(first_name, last_name, avatar_url)")
      .order("assigned_at", { ascending: false });

    if (campaignPhaseId) {
      query = query.eq("campaign_phase_id", campaignPhaseId);
    }
    if (reviewerId) {
      query = query.eq("reviewer_id", reviewerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reviewer assignments:", error.message);
      // toast.error("Failed to load reviewer assignments."); // Cannot use toast in server-only service
      return null;
    }
    return data as ReviewerAssignment[];
  },

  async createReviewerAssignment(
    applicationId: string,
    reviewerId: string,
    campaignPhaseId: string,
    status: ReviewerAssignment['status'] = 'assigned'
  ): Promise<ReviewerAssignment | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("reviewer_assignments")
      .insert([{ application_id: applicationId, reviewer_id: reviewerId, campaign_phase_id: campaignPhaseId, status }])
      .select("*, applications(*, profiles(first_name, last_name, avatar_url)), campaign_phases(*), profiles!reviewer_assignments_reviewer_id_fkey(first_name, last_name, avatar_url)")
      .single();

    if (error) {
      console.error("Error creating reviewer assignment:", error.message);
      // toast.error("Failed to create reviewer assignment."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Reviewer assigned successfully!"); // Cannot use toast in server-only service
    return data as ReviewerAssignment;
  },

  async updateReviewerAssignment(
    id: string,
    updates: Partial<Omit<ReviewerAssignment, "id" | "application_id" | "reviewer_id" | "campaign_phase_id" | "created_at">>
  ): Promise<ReviewerAssignment | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("reviewer_assignments")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, applications(*, profiles(first_name, last_name, avatar_url)), campaign_phases(*), profiles!reviewer_assignments_reviewer_id_fkey(first_name, last_name, avatar_url)")
      .single();

    if (error) {
      console.error(`Error updating reviewer assignment ${id}:`, error.message);
      // toast.error("Failed to update reviewer assignment."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Reviewer assignment updated successfully!"); // Cannot use toast in server-only service
    return data as ReviewerAssignment;
  },

  async deleteReviewerAssignment(id: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("reviewer_assignments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting reviewer assignment ${id}:`, error.message);
      // toast.error("Failed to delete reviewer assignment."); // Cannot use toast in server-only service
      return false;
    }
    // toast.success("Reviewer assignment deleted successfully!"); // Cannot use toast in server-only service
    return true;
  },

  // --- Reviews ---
  async getReviews(applicationId?: string, reviewerId?: string, campaignPhaseId?: string): Promise<Review[] | null> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from("reviews")
      .select("*, applications(*, profiles(first_name, last_name, avatar_url)), campaign_phases(*), profiles!reviews_reviewer_id_fkey(first_name, last_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (applicationId) {
      query = query.eq("application_id", applicationId);
    }
    if (reviewerId) {
      query = query.eq("reviewer_id", reviewerId);
    }
    if (campaignPhaseId) {
      query = query.eq("campaign_phase_id", campaignPhaseId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reviews:", error.message);
      // toast.error("Failed to load reviews."); // Cannot use toast in server-only service
      return null;
    }
    return data as Review[];
  },

  async createReview(
    applicationId: string,
    reviewerId: string,
    campaignPhaseId: string,
    score: Record<string, any> = {},
    comments: string | null = null,
    status: Review['status'] = 'pending'
  ): Promise<Review | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("reviews")
      .insert([{ application_id: applicationId, reviewer_id: reviewerId, campaign_phase_id: campaignPhaseId, score, comments, status }])
      .select("*, applications(*, profiles(first_name, last_name, avatar_url)), campaign_phases(*), profiles!reviews_reviewer_id_fkey(first_name, last_name, avatar_url)")
      .single();

    if (error) {
      console.error("Error creating review:", error.message);
      // toast.error("Failed to create review."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Review created successfully!"); // Cannot use toast in server-only service
    return data as Review;
  },

  async updateReview(
    id: string,
    updates: Partial<Omit<Review, "id" | "application_id" | "reviewer_id" | "campaign_phase_id" | "created_at">>
  ): Promise<Review | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("reviews")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, applications(*, profiles(first_name, last_name, avatar_url)), campaign_phases(*), profiles!reviews_reviewer_id_fkey(first_name, last_name, avatar_url)")
      .single();

    if (error) {
      console.error(`Error updating review ${id}:`, error.message);
      // toast.error("Failed to update review."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Review updated successfully!"); // Cannot use toast in server-only service
    return data as Review;
  },

  async deleteReview(id: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting review ${id}:`, error.message);
      // toast.error("Failed to delete review."); // Cannot use toast in server-only service
      return false;
    }
    // toast.success("Review deleted successfully!"); // Cannot use toast in server-only service
    return true;
  },

  // --- Decisions ---
  async getDecisions(applicationId?: string, campaignPhaseId?: string): Promise<Decision[] | null> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from("decisions")
      .select("*, applications(*, profiles(first_name, last_name, avatar_url)), campaign_phases(*), profiles!decisions_decider_id_fkey(first_name, last_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (applicationId) {
      query = query.eq("application_id", applicationId);
    }
    if (campaignPhaseId) {
      query = query.eq("campaign_phase_id", campaignPhaseId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching decisions:", error.message);
      // toast.error("Failed to load decisions."); // Cannot use toast in server-only service
      return null;
    }
    return data as Decision[];
  },

  async createDecision(
    applicationId: string,
    campaignPhaseId: string,
    deciderId: string,
    outcome: string,
    notes: string | null = null,
    isFinal: boolean = false
  ): Promise<Decision | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("decisions")
      .insert([{ application_id: applicationId, campaign_phase_id: campaignPhaseId, decider_id: deciderId, outcome, notes, is_final: isFinal }])
      .select("*, applications(*, profiles(first_name, last_name, avatar_url)), campaign_phases(*), profiles!decisions_decider_id_fkey(first_name, last_name, avatar_url)")
      .single();

    if (error) {
      console.error("Error creating decision:", error.message);
      // toast.error("Failed to create decision."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Decision recorded successfully!"); // Cannot use toast in server-only service
    return data as Decision;
  },

  async updateDecision(
    id: string,
    updates: Partial<Omit<Decision, "id" | "application_id" | "campaign_phase_id" | "decider_id" | "created_at">>
  ): Promise<Decision | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("decisions")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, applications(*, profiles(first_name, last_name, avatar_url)), campaign_phases(*), profiles!decisions_decider_id_fkey(first_name, last_name, avatar_url)")
      .single();

    if (error) {
      console.error(`Error updating decision ${id}:`, error.message);
      // toast.error("Failed to update decision."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Decision updated successfully!"); // Cannot use toast in server-only service
    return data as Decision;
  },

  async deleteDecision(id: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("decisions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting decision ${id}:`, error.message);
      // toast.error("Failed to delete decision."); // Cannot use toast in server-only service
      return false;
    }
    // toast.success("Decision deleted successfully!"); // Cannot use toast in server-only service
    return true;
  },
};