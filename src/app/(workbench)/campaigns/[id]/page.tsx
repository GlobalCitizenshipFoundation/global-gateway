import React from "react";
import { notFound } from "next/navigation";
import { CampaignDetail } from "@/features/campaigns/components/CampaignDetail";
import { getCampaignByIdAction } from "@/features/campaigns/actions";

interface CampaignDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = params;
  // Fetch campaign to ensure user has read access before rendering the client component
  const campaign = await getCampaignByIdAction(id);

  if (!campaign) {
    notFound(); // This will render the nearest not-found.tsx or the global 404 page
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <CampaignDetail campaignId={id} />
    </div>
  );
}