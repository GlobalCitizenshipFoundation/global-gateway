"use client";

import { createClient } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApplicationOverviewReport {
  totalApplications: number;
  submittedApplications: number;
  inReviewApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  applicationsByStatus: { status: string; count: number }[];
  applicationsByCampaign: { campaignName: string; count: number }[];
}

export const reportService = {
  supabase: createClient(),

  async getApplicationOverviewReport(): Promise<ApplicationOverviewReport | null> {
    try {
      // Fetch total applications
      const { count: totalApplications, error: totalError } = await this.supabase
        .from("applications")
        .select("*", { count: 'exact', head: true });
      if (totalError) throw totalError;

      // Fetch applications by status
      const { data: statusCounts, error: statusError } = await this.supabase
        .from("applications")
        .select("status, count")
        .order("status"); // Group by status and count
      if (statusError) throw statusError;

      // Fetch applications by screening_status
      const { data: screeningStatusCounts, error: screeningStatusError } = await this.supabase
        .from("applications")
        .select("screening_status, count")
        .order("screening_status"); // Group by screening_status and count
      if (screeningStatusError) throw screeningStatusError;

      // Fetch applications by campaign
      const { data: campaignCounts, error: campaignError } = await this.supabase
        .from("applications")
        .select("campaigns(name), count")
        .order("campaigns.name"); // Group by campaign name and count
      if (campaignError) throw campaignError;

      const applicationsByStatus = statusCounts?.map(row => ({ status: row.status, count: row.count })) || [];
      const applicationsByScreeningStatus = screeningStatusCounts?.map(row => ({ status: row.screening_status, count: row.count })) || [];
      const applicationsByCampaign = campaignCounts?.map((row: { campaigns: { name: string | null } | null; count: number }) => ({
        campaignName: row.campaigns?.name || 'Unknown',
        count: row.count,
      })) || [];

      const submittedApplications = applicationsByStatus.find(s => s.status === 'submitted')?.count || 0;
      const inReviewApplications = applicationsByStatus.find(s => s.status === 'in_review')?.count || 0;
      const acceptedApplications = applicationsByStatus.find(s => s.status === 'accepted')?.count || 0;
      const rejectedApplications = applicationsByStatus.find(s => s.status === 'rejected')?.count || 0;

      return {
        totalApplications: totalApplications || 0,
        submittedApplications,
        inReviewApplications,
        acceptedApplications,
        rejectedApplications,
        applicationsByStatus: [...applicationsByStatus, ...applicationsByScreeningStatus], // Combine for a broader view
        applicationsByCampaign,
      };
    } catch (error: any) {
      console.error("Error fetching application overview report:", error.message);
      toast.error("Failed to load application overview report.");
      return null;
    }
  },
};