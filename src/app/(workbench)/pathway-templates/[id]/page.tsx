import React from "react";
import { PathwayTemplateDetail } from "@/features/pathway-templates/components/PathwayTemplateDetail";
import { getTemplateByIdAction } from "@/features/pathway-templates/actions";
import { notFound } from "next/navigation";

interface PathwayTemplateDetailPageProps {
  params: {
    id: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function PathwayTemplateDetailPage({ params }: PathwayTemplateDetailPageProps) {
  const { id } = params;
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