import React from "react";
import { notFound } from "next/navigation";
import { PackageForm } from "@/features/packages/components/PackageForm";
import { getPackageByIdAction } from "@/features/packages/actions";

interface EditPackagePageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function EditPackagePage({ params }: EditPackagePageProps) {
  const { id } = params;
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