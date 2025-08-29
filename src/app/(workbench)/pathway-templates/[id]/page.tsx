import React from "react";
import { PathwayTemplateForm } from "@/features/pathway-templates/components/PathwayTemplateForm";
import { getTemplateByIdAction } from "@/features/pathway-templates/actions";
import { notFound } from "next/navigation";

interface EditPathwayTemplatePageProps {
  params: {
    id: string;
  };
}

export default async function EditPathwayTemplatePage({ params }: EditPathwayTemplatePageProps) {
  const { id } = params;
  const template = await getTemplateByIdAction(id);

  if (!template) {
    notFound(); // This will render the nearest not-found.tsx or the global 404 page
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PathwayTemplateForm initialData={template} />
    </div>
  );
}