import React from "react";
import { notFound } from "next/navigation";
import { PackageDetail } from "@/features/packages/components/PackageDetail";
import { getPackageByIdAction } from "@/features/packages/actions";

interface PackageDetailPageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = params;
  const pkg = await getPackageByIdAction(id);

  if (!pkg) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PackageDetail packageId={id} />
    </div>
  );
}