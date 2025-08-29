import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import React from "react"; // Import React

export default async function PortalDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login"); // Redirect to login if no user session
  }

  // In a real app, you'd fetch user-specific data here
  const userRole: string = user.user_metadata?.role || 'applicant'; // Explicitly type userRole as string

  // Allow 'applicant' role, and also higher roles that can access portal
  if (!['applicant', 'coordinator', 'evaluator', 'screener', 'admin'].includes(userRole)) {
    redirect("/error-pages/403"); // Redirect to 403 if authenticated but not authorized for portal
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-display-medium mb-4">Welcome to the Applicant Portal!</h1>
      <p className="text-headline-small text-muted-foreground">Hello, {user.user_metadata?.first_name || user.email}!</p>
      <p className="text-title-medium text-muted-foreground mt-2">Your role: {userRole}</p>
      <p className="mt-8 text-center text-body-large">This is your personalized dashboard where you can track your applications and progress.</p>
    </div>
  );
}