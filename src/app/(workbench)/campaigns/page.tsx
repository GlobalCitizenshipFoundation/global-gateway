import React from "react";
import { CampaignList } from "@/features/campaigns/components/CampaignList";

export default function CampaignsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <CampaignList />
    </div>
  );
}