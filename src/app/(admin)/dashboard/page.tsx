import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userRole = user.user_metadata?.role;

  if (userRole !== 'admin') {
    redirect("/login"); // Or a 403 forbidden page
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-display-medium mb-4">Welcome to the Admin Console!</h1>
      <p className="text-headline-small text-muted-foreground">Hello, {user.user_metadata?.first_name || user.email}!</p>
      <p className="text-title-medium text-muted-foreground mt-2">Your role: {userRole}</p>
      <p className="mt-8 text-center text-body-large">This is where you manage users, system settings, and overall platform configuration.</p>
    </div>
  );
}