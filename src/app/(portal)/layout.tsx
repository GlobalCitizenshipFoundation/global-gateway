import React from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}