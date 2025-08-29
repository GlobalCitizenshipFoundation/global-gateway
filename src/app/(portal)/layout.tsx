import React from "react";
// import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout"; // Temporarily removed

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>; // Render children directly for testing
}