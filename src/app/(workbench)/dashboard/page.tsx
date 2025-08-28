import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";

export default async function WorkbenchDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userRole = user.user_metadata?.role;

  if (!['coordinator', 'evaluator', 'screener', 'admin'].includes(userRole)) {
    redirect("/login"); // Or a 403 forbidden page
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Workbench!</h1>
      <p className="text-lg text-muted-foreground">Hello, {user.user_metadata?.first_name || user.email}!</p>
      <p className="text-md text-muted-foreground mt-2">Your role: {userRole}</p>
      <p className="mt-8 text-center">Here you can manage campaigns, review applications, and coordinate workflows.</p>
    </div>
  );
}