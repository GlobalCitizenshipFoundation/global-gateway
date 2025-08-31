import React from "react";
import { notFound } from "next/navigation";
import { PackageDetail } from "@/features/packages/components/PackageDetail";
import { getPackageByIdAction } from "@/features/packages/actions";

interface PackageDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>; // Adjusted type for Next.js type checker
}

export default async function PackageDetailPage(props: PackageDetailPageProps) {
  const { params } = props;
  const resolvedParams = await params;
  const { id } = resolvedParams;
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