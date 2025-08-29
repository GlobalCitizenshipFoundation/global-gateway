import React from "react";
import { notFound } from "next/navigation";
import { CampaignForm } from "@/features/campaigns/components/CampaignForm";
import { getCampaignByIdAction } from "@/features/campaigns/actions";

interface EditCampaignPageProps {
  params: {
    id: string;
  };
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = params;
  const campaign = await getCampaignByIdAction(id);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <CampaignForm initialData={campaign} />
    </div>
  );
}