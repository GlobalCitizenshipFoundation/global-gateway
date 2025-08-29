"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSession } from "@/context/SessionContextProvider";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react"; // Import React
import { toast } from "sonner";

export default function LoginPage() {
  const { supabase, session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      // Redirect authenticated users based on their role (this will be handled by middleware too, but good for client-side UX)
      const userRole = session.user?.user_metadata?.role;
      if (userRole === "admin") {
        router.push("/admin/dashboard");
      } else if (userRole === "coordinator" || userRole === "evaluator" || userRole === "screener") {
        router.push("/workbench/dashboard");
      } else {
        router.push("/portal/dashboard");
      }
      toast.success("You are already logged in!");
    }
  }, [session, isLoading, router]);

  if (isLoading || session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground text-headline-small">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-card shadow-lg rounded-lg border border-border">
        <h2 className="text-headline-large text-center text-foreground">Welcome to Global Gateway</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]} // No third-party providers unless specified
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "hsl(var(--primary))",
                  brandAccent: "hsl(var(--primary-container))",
                  inputBackground: "hsl(var(--input))",
                  inputBorder: "hsl(var(--border))",
                  inputBorderHover: "hsl(var(--ring))",
                  inputBorderFocus: "hsl(var(--ring))",
                  inputText: "hsl(var(--foreground))",
                  messageText: "hsl(var(--foreground))",
                  messageBackground: "hsl(var(--card))",
                  messageBorder: "hsl(var(--border))",
                  anchorTextColor: "hsl(var(--primary))",
                  anchorTextHoverColor: "hsl(var(--primary-container-foreground))",
                },
              },
            },
          }}
          theme="light" // Default to light theme, ThemeProvider will handle actual theme
          redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`} // Supabase will redirect here after auth
        />
      </div>
    </div>
  );
}