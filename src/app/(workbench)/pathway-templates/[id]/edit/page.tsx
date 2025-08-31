import React from "react";
import { notFound } from "next/navigation";
import { PathwayTemplateForm } from "@/features/pathway-templates/components/PathwayTemplateForm";
import { getTemplateByIdAction } from "@/features/pathway-templates/actions";

interface EditPathwayTemplatePageProps {
  params: {
    id: string;
  };
}

export default async function EditPathwayTemplatePage(props: any) {
  const params = props.params as { id: string };
  const { id } = params;

  // Validate if 'id' is a UUID before proceeding to fetch
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUUID) {
    notFound(); // If it's not a valid UUID, it's a 404
  }

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