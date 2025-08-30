"use client";

import React, { useState, useEffect } from "react"; // Import useEffect
import { useSession } from "@/context/SessionContextProvider";
import { Card, CardContent } from "@/components/ui/card";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { useRouter } from "next/navigation"; // Import useRouter

export default function LoginPage() {
  const { session, isLoading, user } = useSession(); // Get user from session context
  const [isSigningUp, setIsSigningUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session && user) {
      // User is authenticated, redirect to their dashboard
      const userRole: string = user.user_metadata?.role || '';
      if (userRole === "admin") {
        router.replace("/dashboard"); // Use replace to prevent going back to login
      } else if (['coordinator', 'evaluator', 'screener', 'reviewer'].includes(userRole)) {
        router.replace("/desk");
      } else { // Default for applicant
        router.replace("/home");
      }
    }
  }, [isLoading, session, user, router]); // Depend on isLoading, session, user, router

  if (isLoading || (session && user)) {
    // If loading, show loading. If session exists, useEffect will handle redirect.
    // We don't want to render the forms if a redirect is pending.
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <p className="text-foreground text-headline-small">Loading...</p>
      </div>
    );
  }

  // If not loading and no session, render the login/signup forms.
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