"use server";

import { createClient } from "@/integrations/supabase/server";

export interface ApplicationOverviewReport {
  totalApplications: number;
  submittedApplications: number;
  inReviewApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  applicationsByStatus: { status: string; count: number }[];
  applicationsByCampaign: { campaignName: string; count: number }[];
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getApplicationOverviewReport(): Promise<ApplicationOverviewReport | null> {
  try {
    const supabase = await getSupabase();
    // Fetch total applications
    const { count: totalApplications, error: totalError } = await supabase
      .from("applications")
      .select("*", { count: 'exact', head: true });
    if (totalError) throw totalError;

    // Fetch applications by status
    const { data: statusCounts, error: statusError } = await supabase
      .from("applications")
      .select("status, count")
      .order("status"); // Group by status and count
    if (statusError) throw statusError;

    // Fetch applications by screening_status
    const { data: screeningStatusCounts, error: screeningStatusError } = await supabase
      .from("applications")
      .select("screening_status, count")
      .order("screening_status"); // Group by screening_status and count
    if (screeningStatusError) throw screeningStatusError;

    // Fetch applications by campaign_id and count them using Supabase aggregation syntax
    const { data: campaignIdCounts, error: campaignIdError } = await supabase
      .from("applications")
      .select("campaign_id, count()") // Correct aggregation syntax
      .returns<{ campaign_id: string | null; count: number }[]>(); // Explicitly type the return
    if (campaignIdError) throw campaignIdError;

    const campaignCountsMap = new Map<string | null, number>();
    campaignIdCounts?.forEach((row: { campaign_id: string | null; count: number }) => {
      campaignCountsMap.set(row.campaign_id, row.count);
    });

    // Get all unique campaign IDs from the results, excluding nulls
    const uniqueCampaignIds = Array.from(campaignCountsMap.keys()).filter(id => id !== null) as string[];

    let applicationsByCampaign: { campaignName: string; count: number }[] = [];

    if (uniqueCampaignIds.length > 0) {
      // Fetch campaign names for these IDs
      const { data: campaignNames, error: campaignNamesError } = await supabase
        .from("campaigns")
        .select("id, name")
        .in("id", uniqueCampaignIds);
      if (campaignNamesError) throw campaignNamesError;

      const campaignNameLookup = new Map(campaignNames?.map(c => [c.id, c.name]));

      applicationsByCampaign = uniqueCampaignIds.map(id => ({
        campaignName: campaignNameLookup.get(id) || 'Unknown Campaign',
        count: campaignCountsMap.get(id) || 0,
      }));
    }

    // Handle applications with null campaign_id (if any)
    const nullCampaignCount = campaignCountsMap.get(null);
    if (nullCampaignCount !== undefined && nullCampaignCount > 0) {
      applicationsByCampaign.push({ campaignName: 'No Campaign', count: nullCampaignCount });
    }

    const applicationsByStatus = statusCounts?.map(row => ({ status: row.status, count: row.count })) || [];
    const applicationsByScreeningStatus = screeningStatusCounts?.map(row => ({ status: row.screening_status, count: row.count })) || [];
    
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
    return null;
  }
}