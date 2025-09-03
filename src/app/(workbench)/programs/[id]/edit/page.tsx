import React from "react";
import { notFound } from "next/navigation";
import { ProgramForm } from "@/features/programs/components/ProgramForm";
import { getProgramByIdAction } from "@/features/programs/actions";

interface EditProgramPageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function EditProgramPage({ params }: EditProgramPageProps) {
  const { id } = params;
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