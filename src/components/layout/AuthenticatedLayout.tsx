"use client";

import React, { useState } from "react"; // Import useState
import { useSession } from "@/context/SessionContextProvider";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Import cn for utility classes

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // State for sidebar collapse

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground text-headline-small">Loading application...</p>
      </div>
    );
  }

  if (!session) {
    // This case should ideally be caught by middleware, but as a client-side fallback
    toast.error("You are not authenticated. Please log in.");
    router.push("/login");
    return null;
  }

  return (
    <div className="flex flex-1 flex-row-reverse"> {/* flex-row-reverse to place sidebar on the right */}
      <Sidebar isCollapsed={isSidebarCollapsed} toggleCollapsed={toggleSidebar} />
      <main
        className={cn(
          "flex-1 p-8 overflow-auto bg-background text-foreground transition-all duration-300",
          isSidebarCollapsed ? "mr-20" : "mr-64" // Adjust margin based on sidebar width
        )}
      >
        {children}
      </main>
    </div>
  );
}