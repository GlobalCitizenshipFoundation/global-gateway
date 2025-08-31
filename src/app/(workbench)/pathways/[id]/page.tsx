import { notFound } from "next/navigation";
import { getTemplateByIdAction, getPhasesAction } from "@/features/pathways/actions";
import React from "react";
import { PathwayTemplateBuilderPage } from "@/features/pathways/components/PathwayTemplateBuilderPage"; // Import the new builder page

interface PathwayTemplateDetailPageProps {
  params: Promise<{ id: string }>; // Adjusted type for Next.js type checker
  searchParams?: Promise<Record<string, string | string[] | undefined>>; // Adjusted type for Next.js type checker
}

export default async function PathwayTemplateDetailPage(props: PathwayTemplateDetailPageProps) {
  const { params } = props;
  const resolvedParams = await params; // Await params to resolve proxy
  const { id } = resolvedParams;

  // Validate if 'id' is a UUID before proceeding to fetch
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUUID) {
    notFound(); // If it's not a valid UUID, it's a 404
  }

  // Fetch template and phases to ensure user has read access before rendering the client component
  const template = await getTemplateByIdAction(id);
  const phases = template ? await getPhasesAction(id) : null; // Only fetch phases if template is found

  if (!template) {
    notFound(); // This will render the nearest not-found.tsx or the global 404 page
  }

  return (
    <PathwayTemplateBuilderPage
      templateId={id}
      initialTemplate={template}
      initialPhases={phases || []}
    />
  );
}