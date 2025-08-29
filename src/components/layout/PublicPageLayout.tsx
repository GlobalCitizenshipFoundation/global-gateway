"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PublicPageLayoutProps {
  children: React.ReactNode;
}

export function PublicPageLayout({ children }: PublicPageLayoutProps) {
  return (
    <div className={cn(
      "flex flex-col flex-1 w-full bg-background text-foreground",
      "min-h-0 overflow-y-auto" // Allow content to scroll if it exceeds available height
    )}>
      {children}
    </div>
  );
}