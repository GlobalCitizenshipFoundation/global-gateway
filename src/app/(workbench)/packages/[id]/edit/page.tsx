import React from "react";
import { notFound } from "next/navigation";
import { PackageForm } from "@/features/packages/components/PackageForm";
import { getPackageByIdAction } from "@/features/packages/actions";

interface EditPackagePageProps {
  params: Promise<{ id: string }>; // Adjusted type for Next.js type checker
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function EditPackagePage(props: EditPackagePageProps) {
  const { params } = props;
  const resolvedParams = await params; // Await params to resolve proxy
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