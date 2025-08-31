import React from "react";
import { PathwayTemplateDetail } from "@/features/pathway-templates/components/PathwayTemplateDetail";
import { getTemplateByIdAction } from "@/features/pathway-templates/actions";
import { notFound, redirect } from "next/navigation"; // Import redirect

interface PathwayTemplateDetailPageProps {
  params: {
    id: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function PathwayTemplateDetailPage({ params }: PathwayTemplateDetailPageProps) {
  const { id } = params;

  // Explicitly handle the 'new' case to ensure it's routed to the correct page
  if (id === 'new') {
    redirect("/workbench/pathway-templates/new");
  }

  // Validate if 'id' is a UUID before proceeding to fetch
  // This helps prevent unnecessary database calls with invalid IDs
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUUID) {
    notFound(); // If it's not 'new' and not a valid UUID, it's a 404
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