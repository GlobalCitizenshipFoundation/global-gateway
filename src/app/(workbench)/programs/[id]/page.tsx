import React from "react";
import { notFound } from "next/navigation";
import { ProgramDetail } from "@/features/programs/components/ProgramDetail";
import { getProgramByIdAction } from "@/features/programs/actions";

interface ProgramDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>; // Adjusted type for Next.js type checker
}

export default async function ProgramDetailPage(props: ProgramDetailPageProps) {
  const { params } = props;
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const program = await getProgramByIdAction(id);

  if (!program) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ProgramDetail programId={id} />
    </div>
  );
}