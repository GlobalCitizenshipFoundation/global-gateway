import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import React from "react"; // Import React

export default async function WorkbenchDeskPage() {
  // The middleware.ts should have already ensured the user is authenticated and authorized for workbench roles.
  // We can still fetch the user to display their name, but no redirects are needed here.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // At this point, 'user' should always be present and have a workbench role due to middleware.
  // If not, it indicates a middleware misconfiguration or bypass.
  // No explicit redirect for !user or unauthorized role is needed here, as middleware handles it.
  const userRole: string = user?.user_metadata?.role || ''; // Explicitly type userRole as string

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-display-medium mb-4">Welcome to the Workbench Desk!</h1>
      <p className="text-headline-small text-muted-foreground">Hello, {user?.user_metadata?.first_name || user?.email}!</p>
      <p className="text-title-medium text-muted-foreground mt-2">Your role: {userRole}</p>
      <p className="mt-8 text-center text-body-large">Here you can manage campaigns, review applications, and coordinate workflows.</p>
    </div>
  );
}