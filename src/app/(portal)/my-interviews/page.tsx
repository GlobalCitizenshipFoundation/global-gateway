import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";
import { ApplicantInterviewScheduler } from "@/features/scheduling/components/ApplicantInterviewScheduler";
import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import { getApplicationsAction } from "@/features/applications/actions"; // To get applicant's applications
import { ApplicationPhase } from "@/features/applications/services/application-service"; // Import ApplicationPhase

export default async function MyInterviewsPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isApplicantOrAdmin = ['applicant', 'admin'].includes(userRole);

  if (!isApplicantOrAdmin) {
    redirect("/error/403");
  }

  // Fetch applicant's applications to find one that is in a scheduling phase
  // For simplicity, we'll assume the first application found that is in a 'Scheduling' phase
  // or any application if no specific phase is active, to allow booking.
  const applications = await getApplicationsAction();
  const applicantApplications = applications?.filter(app => app.applicant_id === user.id);

  let targetApplicationId: string | undefined;
  let targetCampaignPhaseId: string | undefined;

  if (applicantApplications && applicantApplications.length > 0) {
    // Find an application that is currently in a 'Scheduling' phase
    const schedulingApp = applicantApplications.find(app => (app.current_campaign_phases as ApplicationPhase)?.type === 'Scheduling');
    if (schedulingApp) {
      targetApplicationId = schedulingApp.id;
      targetCampaignPhaseId = (schedulingApp.current_campaign_phases as ApplicationPhase)?.id;
    } else {
      // If no app is in a scheduling phase, just pick the first one to allow viewing past/future interviews
      // and potentially booking if a phase becomes active later.
      targetApplicationId = applicantApplications[0].id;
      // targetCampaignPhaseId remains undefined if no scheduling phase is active
    }
  }

  if (!targetApplicationId) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <Card className="rounded-xl shadow-lg p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="h-7 w-7 text-primary" /> My Interviews
            </CardTitle>
            <CardDescription className="text-body-large text-muted-foreground">
              Manage your scheduled interviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 text-body-medium text-muted-foreground">
            <p>You currently do not have any active applications that require scheduling an interview.</p>
            <p className="mt-2">Please check your applications for updates or contact your program coordinator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <h1 className="text-display-small font-bold text-foreground">My Interviews</h1>
      <p className="text-headline-small text-muted-foreground">View and manage your scheduled interviews.</p>

      {targetApplicationId && targetCampaignPhaseId ? (
        <ApplicantInterviewScheduler
          applicationId={targetApplicationId}
          campaignPhaseId={targetCampaignPhaseId}
        />
      ) : (
        <Card className="rounded-xl shadow-lg p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-headline-small font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="h-7 w-7 text-primary" /> Interview Scheduling
            </CardTitle>
            <CardDescription className="text-body-large text-muted-foreground">
              No active scheduling phase found for your applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 text-body-medium text-muted-foreground">
            <p>You can view your past and upcoming interviews below, but there is no active phase for new bookings.</p>
          </CardContent>
        </Card>
      )}
      {/* Always show scheduled interviews even if no active scheduling phase */}
      {targetApplicationId && (
        <ApplicantInterviewScheduler
          applicationId={targetApplicationId}
          campaignPhaseId={targetCampaignPhaseId || "placeholder-id"} // Provide a placeholder if no active phase
        />
      )}
    </div>
  );
}