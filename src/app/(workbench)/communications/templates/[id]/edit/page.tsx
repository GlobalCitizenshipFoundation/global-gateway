import { notFound } from "next/navigation";
import { CommunicationTemplateForm } from "@/features/communications/components/CommunicationTemplateForm"; // Direct import
import { getCommunicationTemplateByIdAction } from "@/features/communications/actions"; // Direct import
import React from "react";

interface EditCommunicationTemplatePageProps {
  params: { id: string };
}

export default async function EditCommunicationTemplatePage({ params }: EditCommunicationTemplatePageProps) {
  const { id } = params;
  const template = await getCommunicationTemplateByIdAction(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <CommunicationTemplateForm initialData={template} />
    </div>
  );
}