"use client";

import React from "react";
import { useSession } from "@/context/SessionContextProvider";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { toast } from "sonner";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { session, isLoading } = useSession();
  const router = useRouter();

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
    <div className="flex flex-1"> {/* flex-1 to take remaining height after root header */}
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-background text-foreground">
        {children}
      </main>
    </div>
  );
}