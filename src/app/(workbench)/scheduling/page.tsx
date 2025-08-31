import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { HostAvailabilityManager } from "@/features/scheduling/components/HostAvailabilityManager"; // Import HostAvailabilityManager
import { createClient } from "@/integrations/supabase/server"; // Import createClient for server-side auth
import { redirect } from "next/navigation"; // Import redirect

export default async function SchedulingDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdminOrHost = ['admin', 'coordinator', 'host'].includes(userRole); // Define roles that can manage scheduling

  if (!isAdminOrHost) {
    redirect("/error/403"); // Redirect if not authorized
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" /> Scheduling Dashboard
          </CardTitle>
          <CardDescription className="text-body-large text-muted-foreground">
            Manage interview schedules, host availability, and applicant bookings.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground">
          <p>This dashboard will centralize all scheduling-related tasks for campaigns.</p>
          <p className="mt-2">Coming soon: Calendar views, booking management, and host availability tools.</p>
        </CardContent>
      </Card>

      {/* Host Availability Management Section */}
      <HostAvailabilityManager canModify={isAdminOrHost} />
    </div>
  );
}