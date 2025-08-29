import React from "react";
import { CommunicationTemplateList } from "@/features/communications/components/CommunicationTemplateList"; // Direct import

export default function CommunicationTemplatesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <CommunicationTemplateList />
    </div>
  );
}