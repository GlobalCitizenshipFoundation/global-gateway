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
  const router = useRouter();

  useEffect(() => {
    console.log("[LoginPage useEffect] isLoading:", isLoading, "session:", session, "user:", user);
    if (!isLoading && session && user) {
      console.log("[LoginPage useEffect] User authenticated, attempting redirect...");
      const userRole: string = user.user_metadata?.role || '';
      let redirectPath = "/home"; // Default
      if (userRole === "admin") {
        redirectPath = "/dashboard";
      } else if (['coordinator', 'evaluator', 'screener', 'reviewer'].includes(userRole)) {
        redirectPath = "/desk";
      }
      // Only redirect if not already on the target path to prevent unnecessary navigations
      // In App Router, router.pathname is not directly available. Use window.location.pathname
      if (window.location.pathname !== redirectPath) {
        router.replace(redirectPath);
      }
    }
  }, [isLoading, session, user, router]);

  if (isLoading) { // Only show loading if the session is still being determined
    console.log("[LoginPage Render] Showing initial loading state.");
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <p className="text-foreground text-headline-small">Loading...</p>
      </div>
    );
  }

  // If not loading, and no session, render the forms.
  // If not loading, and session exists, the useEffect should have already handled the redirect.
  // If we reach here and session exists, it means the redirect is failing or delayed,
  // but we should still render the forms as a fallback, or show a more explicit error.
  // For now, the assumption is that if `isLoading` is false and `session` is present,
  // the `useEffect` will handle the redirect. If it doesn't, the user will see the login form
  // briefly before the redirect (if it eventually works) or if it's truly stuck.
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