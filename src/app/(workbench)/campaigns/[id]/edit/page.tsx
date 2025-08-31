import React from "react";
import { notFound } from "next/navigation";
import { CampaignForm } from "@/features/campaigns/components/CampaignForm";
import { getCampaignByIdAction } from "@/features/campaigns/actions";

interface EditCampaignPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>; // Adjusted type for Next.js type checker
}

export default async function EditCampaignPage(props: EditCampaignPageProps) {
  const { params } = props;
  const resolvedParams = await params;
  const { id } = resolvedParams;
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