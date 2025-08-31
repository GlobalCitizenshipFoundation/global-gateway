import React from "react";
import { notFound } from "next/navigation";
import { PackageForm } from "@/features/packages/components/PackageForm";
import { getPackageByIdAction } from "@/features/packages/actions";

interface EditPackagePageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>; // Adjusted type for Next.js type checker
}

export default async function EditPackagePage(props: EditPackagePageProps) {
  const { params } = props;
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const pkg = await getPackageByIdAction(id);

  if (!pkg) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PackageForm initialData={pkg} />
    </div>
  );
}