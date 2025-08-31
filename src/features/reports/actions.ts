"use server";

import {
  ApplicationOverviewReport,
  getApplicationOverviewReport,
} from "./services/report-service";
import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";

// Helper function to check user authorization for reports
async function authorizeReportAccess(): Promise<{ user: any; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  // For now, only admins and coordinators can view reports
  if (!isAdmin && userRole !== 'coordinator') {
    redirect("/error/403");
  }

  return { user, isAdmin };
}

export async function getApplicationOverviewReportAction(): Promise<ApplicationOverviewReport | null> {
  try {
    await authorizeReportAccess(); // Authorize access

    const report = await getApplicationOverviewReport(); // Use the service function
    return report;
  } catch (error: any) {
    console.error("Error in getApplicationOverviewReportAction:", error.message);
    if (error.message === "UnauthorizedAccess") {
      redirect("/error/403");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}