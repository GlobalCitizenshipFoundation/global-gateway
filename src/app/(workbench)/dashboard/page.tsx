import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import React from "react"; // Import React

export default async function WorkbenchDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login"); // Redirect to login if no user session
  }

  const userRole: string = user.user_metadata?.role; // Explicitly type userRole as string

  // Allow 'coordinator', 'evaluator', 'screener', 'admin' roles for workbench
  if (!['coordinator', 'evaluator', 'screener', 'admin'].includes(userRole)) {
    redirect("/error-pages/403"); // Redirect to 403 if authenticated but not authorized for workbench
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-display-medium mb-4">Welcome to the Workbench!</h1>
      <p className="text-headline-small text-muted-foreground">Hello, {user.user_metadata?.first_name || user.email}!</p>
      <p className="text-title-medium text-muted-foreground mt-2">Your role: {userRole}</p>
      <p className="mt-8 text-center text-body-large">Here you can manage campaigns, review applications, and coordinate workflows.</p>
    </div>
  );
}