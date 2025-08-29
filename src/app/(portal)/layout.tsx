import React from "react";
// AuthenticatedLayout is removed as we are simplifying for debugging.

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>; // Render children directly
}