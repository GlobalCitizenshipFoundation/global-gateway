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

  useEffect(() => {
    if (!isLoading && session) {
      // Redirect authenticated users based on their role (this will be handled by middleware too, but good for client-side UX)
      const userRole = session.user?.user_metadata?.role;
      if (userRole === "admin") {
        router.push("/admin/console");
      } else if (userRole === "coordinator" || userRole === "evaluator" || userRole === "screener") {
        router.push("/workbench/desk");
      } else {
        router.push("/portal/home");
      }
      toast.success("You are already logged in!");
    }
  }, [session, isLoading, router]);

  if (isLoading || session) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <p className="text-foreground text-headline-small">Loading...</p>
      </div>
    );
  }

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