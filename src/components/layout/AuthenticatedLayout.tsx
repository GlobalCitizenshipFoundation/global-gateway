"use client";

import React, { useEffect } from "react";
import { useSession } from "@/context/SessionContextProvider";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
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

  // The middleware.ts should handle redirects for unauthenticated users.
  // If we reach this component, a session should exist.
  // The `isLoading` from useSession is for client-side hydration of the session,
  // which should not prevent the server-rendered `children` from appearing.
  // Removing the full-page loading state that replaces `children` to avoid RSC hydration mismatches.

  // If for some reason, after initial load, session becomes null (e.g., token expires client-side),
  // the middleware will eventually catch it on the next navigation.
  // For immediate client-side reaction, we could add a useEffect here to push to login,
  // but it's generally better to let middleware handle the primary redirect.
  useEffect(() => {
    if (!isLoading && !session) {
      // This case should ideally be handled by middleware, but as a fallback for client-side session expiry
      // or if middleware somehow misses it, we can redirect.
      // However, this can also contribute to redirect loops if not careful.
      // Given the current middleware, this should not be necessary for initial load.
      // Let's keep it commented out for now and rely on middleware.
      // router.push("/login");
    }
  }, [session, isLoading, router]);


  return (
    <div className="flex flex-row w-full"> {/* Removed redundant h-full */}
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
          "flex-1 p-8 overflow-y-auto bg-background text-foreground transition-all duration-300 min-h-0 h-full"
        )}
      >
        {/* Render children directly. The middleware ensures authentication. */}
        {children}
      </main>
    </div>
  );
}