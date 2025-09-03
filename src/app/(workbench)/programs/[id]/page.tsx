import React from "react";
import { notFound } from "next/navigation";
import { ProgramDetail } from "@/features/programs/components/ProgramDetail";
import { getProgramByIdAction } from "@/features/programs/actions";

interface ProgramDetailPageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { id } = params;
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