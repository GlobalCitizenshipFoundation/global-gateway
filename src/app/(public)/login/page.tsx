"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContextProvider";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export default function LoginPage() {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const [isSigningUp, setIsSigningUp] = useState(false);

  // The middleware now handles redirection for authenticated users.
  // This useEffect is no longer needed for redirection.
  // If a session exists, the middleware will redirect before this component fully renders.
  // If this component is reached, it means there's no active session or it's still loading.
  useEffect(() => {
    // If not loading and a session is found, it means the middleware might have missed a redirect
    // or there's a slight delay. In such cases, a client-side toast can still be useful,
    // but explicit router.push is redundant and can cause issues.
    if (!isLoading && session) {
      toast.success("You are already logged in!");
      // No explicit router.push here; rely on middleware for navigation.
    }
  }, [session, isLoading]); // Removed 'router' from dependencies as it's not used for push anymore.

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <p className="text-foreground text-headline-small">Loading...</p>
      </div>
    );
  }

  // If not loading and no session, render the login/signup forms.
  // If a session exists, the middleware should have redirected, so this part won't be reached.
  if (!session) {
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

  // If for some reason a session exists and isLoading is false,
  // and the middleware didn't redirect, render nothing as a fallback.
  return null;
}