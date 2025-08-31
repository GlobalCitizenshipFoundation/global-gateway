import { notFound } from "next/navigation";
import { PathwayTemplateDetail } from "@/features/pathways/components/PathwayTemplateDetail";
import { getTemplateByIdAction } from "@/features/pathways/actions";
import React from "react";

interface PathwayTemplateDetailPageProps {
  params: { id: string }; // Adjusted type for Next.js type checker
  searchParams?: { [key: string]: string | string[] | undefined }; // Adjusted type for Next.js type checker
}

export default async function PathwayTemplateDetailPage(props: PathwayTemplateDetailPageProps) {
  const { params } = props;
  const { id } = params;

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