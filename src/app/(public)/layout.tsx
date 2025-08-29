import React from "react";
// AuthenticatedLayout is removed as public routes should not enforce authentication.

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>; // Render children directly
}