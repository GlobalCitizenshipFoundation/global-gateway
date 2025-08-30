"use client";

import React, { useState } from "react";
import { useSession } from "@/context/SessionContextProvider";
import { Card, CardContent } from "@/components/ui/card";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export default function LoginPage() {
  const { session, isLoading } = useSession();
  const [isSigningUp, setIsSigningUp] = useState(false);

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