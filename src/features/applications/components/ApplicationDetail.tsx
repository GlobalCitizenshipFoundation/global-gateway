"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserCircle2, Briefcase, Workflow, CalendarDays, CheckCircle, XCircle, Clock, FileText, Info } from "lucide-react";
import { Application } from "../services/application-service";
import { getApplicationByIdAction, updateApplicationAction } from "../actions";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChecklistItemFormType, ScreeningChecklist } from "./ScreeningChecklist"; // Import the new component and type
import { CollaborativeNotes } from "./CollaborativeNotes"; // Import the new component

interface ApplicationDetailProps {
  applicationId: string;
}

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplicationDetails = async () => {
    setIsLoading(true);
    try {
      const fetchedApplication = await getApplicationByIdAction(applicationId);
      if (!fetchedApplication) {
        toast.error("Application not found or unauthorized.");
        router.push("/workbench/applications/screening");
        return;
      }
      setApplication(fetchedApplication);
    } catch (error: any) {
      toast.error(error.message || "Failed to load application details.");
      router.push("/workbench/applications/screening");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchApplicationDetails();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view applications.");
      router.push("/login");
    }
  }, [user, isSessionLoading, applicationId]);

  const getStatusColor = (status: Application['screening_status']) => {
    switch (status) {
      case "Accepted": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Denied": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "On Hold": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Pending":
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };

  const getScreeningStatusIcon = (status: Application['screening_status']) => {
    switch (status) {
      case "Accepted": return <CheckCircle className="h-4 w-4" />;
      case "Denied": return <XCircle className="h-4 w-4" />;
      case "On Hold": return <Clock className="h-4 w-4" />;
      case "Pending":
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (isLoading || !application) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <Card className="rounded-xl shadow-md p-6">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-20 w-full mb-4" />
        </Card>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const applicantName = `${application.profiles?.first_name || ''} ${application.profiles?.last_name || ''}`.trim();

  const userRole: string = user?.user_metadata?.role || '';
  const isAdminOrRecruiter = ['admin', 'coordinator', 'evaluator', 'screener'].includes(userRole);
  const canModifyApplication: boolean = isAdminOrRecruiter || application.applicant_id === user?.id; // Applicant can modify their own data, recruiters can modify screening tools
  const canAddNotes: boolean = isAdminOrRecruiter; // Only recruiters/admins can add notes

  // Pre-process initialChecklistData to ensure it strictly conforms to ChecklistItemFormType
  const processedChecklistData: ChecklistItemFormType[] = (application.data?.screeningChecklist || []).map((item: any) => ({
    id: item.id,
    item: item.item,
    checked: item.checked ?? false, // Ensure boolean
    notes: item.notes ?? null, // Ensure string | null
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
          <Link href="/workbench/applications/screening">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Screening
          </Link>
        </Button>
        {/* Future: Add actions like "Move to Next Phase", "Send Email" */}
      </div>

      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={application.profiles?.avatar_url || ""} alt={applicantName} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-headline-small">
                {applicantName.charAt(0) || <UserCircle2 className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-display-small font-bold text-foreground">
                {applicantName || "Unknown Applicant"}
              </CardTitle>
              <CardDescription className="text-body-large text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-5 w-5" />
                {application.campaigns?.name || "N/A Campaign"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground space-y-2 mt-4">
          <p className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Current Phase: <span className="font-medium text-foreground">{application.current_campaign_phases?.name || "N/A"}</span>
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Applied: {new Date(application.created_at).toLocaleDateString()}
          </p>
          <Badge className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${getStatusColor(application.screening_status)}`}>
            {getScreeningStatusIcon(application.screening_status)}
            <span className="font-medium text-body-small">Screening Status: {application.screening_status}</span>
          </Badge>
        </CardContent>
      </Card>

      {/* Application Data Section */}
      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-headline-large font-bold text-foreground">Application Content</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            Submitted information by the applicant.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          {Object.keys(application.data).length > 0 ? (
            Object.entries(application.data).map(([key, value]) => (
              // Exclude internal screening data from public display
              key !== 'screeningChecklist' && (
                <div key={key} className="border-b border-border pb-2 last:border-b-0">
                  <p className="text-label-large font-medium text-foreground capitalize">{key.replace(/_/g, ' ')}:</p>
                  <p className="text-body-medium text-muted-foreground">{String(value)}</p>
                </div>
              )
            ))
          ) : (
            <p className="text-body-medium text-muted-foreground">No application data submitted yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Internal Decision Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Internal Checklist */}
        <ScreeningChecklist
          applicationId={application.id}
          initialChecklistData={processedChecklistData} // Pass the processed data
          canModify={isAdminOrRecruiter} // Only recruiters/admins can modify the checklist
          onChecklistUpdated={fetchApplicationDetails} // Refresh data after update
        />

        {/* Collaborative Notes */}
        <CollaborativeNotes
          applicationId={application.id}
          canAddNotes={canAddNotes}
          onNotesUpdated={fetchApplicationDetails} // Refresh data after update
        />
      </div>

      {/* Workflow Participation Section (Placeholder) */}
      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-headline-large font-bold text-foreground">Workflow Participation</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            Overview of applicant's progress across all campaign phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-body-medium text-muted-foreground">
            {/* Placeholder for Workflow Participation */}
            Visual timeline or list of phases and applicant status in each.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}