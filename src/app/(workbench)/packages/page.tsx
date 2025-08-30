import React from "react";
import { PackageList } from "@/features/packages/components/PackageList";

export default function PackagesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <PackageList />
    </div>
  );
}