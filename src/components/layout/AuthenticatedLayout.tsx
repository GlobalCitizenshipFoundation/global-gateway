"use client";

import React, { useEffect } from "react";
import { useSession } from "@/context/SessionContextProvider";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLayout } from "@/context/LayoutContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar, isSidebarCollapsed, toggleSidebarCollapsed } = useLayout();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoading && !session) {
      toast.error("You are not authenticated. Please log in.");
      router.push("/login");
    }
  }, [isLoading, session, router]); // Depend on isLoading, session, and router

  if (isLoading || !session) { // Keep loading state and also check for session here
    // Full-height loading overlay for the content area, with a placeholder sidebar
    return (
      <div className="flex flex-1 bg-background h-full"> {/* Added h-full here */}
        {/* Placeholder for a collapsed sidebar during loading */}
        {!isMobile && (
          <aside className="w-20 border-r border-border bg-sidebar-background p-4 space-y-6 rounded-xl shadow-lg flex-shrink-0">
            <Skeleton className="h-8 w-3/4 mb-6" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </aside>
        )}
        <main className={cn(
          "flex-1 p-8 flex items-center justify-center bg-background text-foreground transition-all duration-300 min-h-0" // Added min-h-0
        )}>
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-12 w-64 rounded-md" />
            <Skeleton className="h-6 w-48 rounded-md" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full"> {/* This is the target div, added h-full */}
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleCollapsed={toggleSidebarCollapsed}
          isMobile={false}
          isOpen={true}
          closeSidebar={() => {}}
        />
      )}

      {/* Mobile Sidebar (Modal) */}
      {isMobile && (
        <Sidebar
          isCollapsed={false}
          toggleCollapsed={() => {}}
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
          "flex-1 p-8 overflow-y-auto bg-background text-foreground transition-all duration-300 min-h-0" // Added min-h-0
        )}
      >
        {children}
      </main>
    </div>
  );
}