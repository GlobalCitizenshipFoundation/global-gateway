"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContextProvider";
import { Card, CardContent } from "@/components/ui/card";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { session, isLoading, user } = useSession();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); // New state for redirection feedback
  const router = useRouter();

  useEffect(() => {
    console.log("[LoginPage useEffect] isLoading:", isLoading, "session:", session, "user:", user);
    if (!isLoading && session && user) {
      console.log("[LoginPage useEffect] User authenticated, initiating redirect...");
      setIsRedirecting(true); // Set redirecting state immediately

      const userRole: string = user.user_metadata?.role || '';
      let redirectPath = "/home"; // Default
      if (userRole === "admin") {
        redirectPath = "/dashboard";
      } else if (['coordinator', 'evaluator', 'screener', 'reviewer'].includes(userRole)) {
        redirectPath = "/desk";
      }
      
      // Only redirect if not already on the target path to prevent unnecessary navigations
      if (window.location.pathname !== redirectPath) {
        router.replace(redirectPath);
      } else {
        // If already on the target path, or redirect is not needed, clear redirecting state
        setIsRedirecting(false);
      }
    } else if (!isLoading && !session && !user) {
      // If not loading and no session, ensure redirecting state is false
      setIsRedirecting(false);
    }
  }, [isLoading, session, user, router]);

  if (isLoading || isRedirecting) { // Show loading or redirecting state
    console.log("[LoginPage Render] Showing loading/redirecting state. isLoading:", isLoading, "isRedirecting:", isRedirecting);
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <p className="text-foreground text-headline-small">
          {isLoading ? "Loading..." : "Redirecting..."}
        </p>
      </div>
    );
  }

  // If not loading and not redirecting, render the forms.
  console.log("[LoginPage Render] Rendering forms.");
  return (
    <div className="flex items-center justify-center h-full w-full bg-background p-4">
      <Card className="w-full max-w-lg p-8 space-y-6 bg-card shadow-lg rounded-xl border border-border">
        <CardContent className="p-0">
          {isSigningUp ? (
            <SignUpForm onSwitchToSignIn={() => setIsSigningUp(false)} />
          ) : (
            <SignInForm onSwitchToSignUp={() => setIsSigningUp(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}