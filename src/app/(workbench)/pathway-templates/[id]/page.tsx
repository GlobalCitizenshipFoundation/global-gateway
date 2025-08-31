import { notFound } from "next/navigation";
import { PathwayTemplateDetail } from "@/features/pathway-templates/components/PathwayTemplateDetail";
import { getTemplateByIdAction } from "@/features/pathway-templates/actions";
import React from "react";

interface PathwayTemplateDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // Adjusted type for Next.js type checker
}

export default async function PathwayTemplateDetailPage(props: PathwayTemplateDetailPageProps) {
  const { params } = props;
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Validate if 'id' is a UUID before proceeding to fetch
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUUID) {
    notFound(); // If it's not a valid UUID, it's a 404
  }

  // Fetch template to ensure user has read access before rendering the client component
  const template = await getTemplateByIdAction(id);

  if (!template) {
    notFound(); // This will render the nearest not-found.tsx or the global 404 page
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PathwayTemplateDetail templateId={id} />
    </div>
  );
}