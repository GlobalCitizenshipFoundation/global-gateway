"use client";

import React, { useState } from "react";
import { useSession } from "@/context/SessionContextProvider";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLayout } from "@/context/LayoutContext"; // Import useLayout
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar, isSidebarCollapsed, toggleSidebarCollapsed } = useLayout(); // Use layout context
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground text-headline-small">Loading application...</p>
      </div>
    );
  }

  if (!session) {
    toast.error("You are not authenticated. Please log in.");
    router.push("/login");
    return null;
  }

  const sidebarWidth = isSidebarCollapsed ? "w-20" : "w-64";
  const mainContentMargin = isSidebarCollapsed ? "ml-20" : "ml-64";

  return (
    <div className="flex flex-1">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleCollapsed={toggleSidebarCollapsed}
          isMobile={false}
          isOpen={true} // Always open on desktop, just collapsed or expanded
          closeSidebar={() => {}} // Not applicable for desktop
        />
      )}

      {/* Mobile Sidebar (Modal) */}
      {isMobile && (
        <Sidebar
          isCollapsed={false} // Mobile sidebar is never collapsed, only open/closed
          toggleCollapsed={() => {}} // Not applicable for mobile collapse
          isMobile={true}
          isOpen={isSidebarOpen}
          closeSidebar={toggleSidebar}
        />
      )}

      {/* Mobile Overlay for Modal Sidebar */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}

      <main
        className={cn(
          "flex-1 p-8 overflow-auto bg-background text-foreground transition-all duration-300",
          !isMobile && mainContentMargin // Apply margin only on desktop
        )}
      >
        {children}
      </main>
    </div>
  );
}