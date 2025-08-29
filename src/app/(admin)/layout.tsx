import React from "react";
// import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout"; // Temporarily commented out

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily render children directly to diagnose 404 issue
  return <>{children}</>;
}