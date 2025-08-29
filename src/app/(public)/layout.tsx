import React from "react";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicPageLayout>{children}</PublicPageLayout>;
}