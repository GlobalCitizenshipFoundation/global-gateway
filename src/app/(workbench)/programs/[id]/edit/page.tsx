import React from "react";
import { notFound } from "next/navigation";
import { ProgramForm } from "@/features/programs/components/ProgramForm";
import { getProgramByIdAction } from "@/features/programs/actions";

interface EditProgramPageProps {
  params: Promise<{ id: string }>; // Adjusted type for Next.js type checker
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function EditProgramPage(props: EditProgramPageProps) {
  const { params } = props;
  const resolvedParams = await params; // Await params to resolve proxy
  const { id } = resolvedParams;
  const program = await getProgramByIdAction(id);

  if (!program) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ProgramForm initialData={program} />
    </div>
  );
}