import { notFound } from "next/navigation";
import { CommunicationTemplateForm } from "@/features/communications/components/CommunicationTemplateForm"; // Direct import
import { getCommunicationTemplateByIdAction } from "@/features/communications/actions"; // Direct import
import React from "react";

interface EditCommunicationTemplatePageProps {
  params: Promise<{ id: string }>; // Adjusted type for Next.js type checker
}

export default async function EditCommunicationTemplatePage(props: EditCommunicationTemplatePageProps) {
  const { params } = props;
  const resolvedParams = await params; // Await params to resolve proxy
  const { id } = resolvedParams;
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