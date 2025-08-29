import React from "react";
import { CommunicationTemplateForm } from "@/features/communications/components/CommunicationTemplateForm"; // Direct import

export default function CreateCommunicationTemplatePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <CommunicationTemplateForm />
    </div>
  );
}