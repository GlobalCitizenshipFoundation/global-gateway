import React from "react";
import { notFound } from "next/navigation";
import { ApplicationDetail } from "@/features/applications/components/ApplicationDetail";
import { getApplicationByIdAction } from "@/features/applications/actions";

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>; // Adjusted type for Next.js type checker
}

export default async function ApplicationDetailPage(props: ApplicationDetailPageProps) {
  const { params } = props;
  const resolvedParams = await params;
  const { id } = resolvedParams;
  // Fetch application to ensure user has read access before rendering the client component
  const application = await getApplicationByIdAction(id);

  if (!application) {
    notFound(); // This will render the nearest not-found.tsx or the global 404 page
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ApplicationDetail applicationId={id} />
    </div>
  );
}