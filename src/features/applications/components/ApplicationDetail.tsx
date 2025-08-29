"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserCircle2, Briefcase, Workflow, CalendarDays, CheckCircle, XCircle, Clock, FileText, Info, Award, Edit, PlusCircle } from "lucide-react"; // Added PlusCircle
import { Application } from "../services/application-service";
import { getApplicationByIdAction, updateApplicationAction } from "../actions";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChecklistItemFormType, ScreeningChecklist } from "./ScreeningChecklist";
import { CollaborativeNotes } from "./CollaborativeNotes";
import { WorkflowParticipation } from "./WorkflowParticipation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewForm } from "@/features/evaluations/components/ReviewForm";
import { getReviewsAction, getReviewerAssignmentsAction, getDecisionsAction } from "@/features/evaluations/actions"; // Added getDecisionsAction
import { Review, ReviewerAssignment, Decision } from "@/features/evaluations/services/evaluation-service";
import { DecisionForm } from "@/features/evaluations/components/DecisionForm"; // Import DecisionForm
import { DecisionList } from "@/features/evaluations/components/DecisionList"; // Import DecisionList

interface ApplicationDetailProps {
  applicationId: string;
}

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | undefined>(undefined);
  const [reviewerAssignment, setReviewerAssignment] = useState<ReviewerAssignment | null>(null);
  const [isDecisionFormOpen, setIsDecisionFormOpen] = useState(false); // State for decision form dialog
  const [editingDecision, setEditingDecision] = useState<Decision | undefined>(undefined); // State for editing decision

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

      // Fetch reviewer assignment and existing review if user is a reviewer and in a review phase
      if (user && fetchedApplication.current_campaign_phase_id && fetchedApplication.campaigns?.id) {
        const assignments = await getReviewerAssignmentsAction(fetchedApplication.current_campaign_phase_id, user.id);
        const assignment = assignments?.find(a => a.application_id === fetchedApplication.id);
        setReviewerAssignment(assignment || null);

        if (assignment) {
          const reviews = await getReviewsAction(fetchedApplication.id, user.id, fetchedApplication.current_campaign_phase_id);
          setCurrentReview(reviews?.[0]); // Assuming one review per reviewer per phase
        }
      }
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

  const handleReviewSaved = () => {
    setIsReviewFormOpen(false);
    fetchApplicationDetails(); // Re-fetch to update review status
  };

  const handleDecisionSaved = () => {
    setIsDecisionFormOpen(false);
    setEditingDecision(undefined);
    fetchApplicationDetails(); // Re-fetch to update application status if needed
  };

  const handleEditDecision = (decision: Decision) => {
    setEditingDecision(decision);
    setIsDecisionFormOpen(true);
  };

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
  const isReviewer = ['reviewer', 'admin', 'coordinator', 'evaluator'].includes(userRole); // Roles that can review
  const canModifyApplication: boolean = isAdminOrRecruiter || application.applicant_id === user?.id;
  const canAddNotes: boolean = isAdminOrRecruiter;
  const canModifyDecisions: boolean = isAdminOrRecruiter; // Only admin/campaign creator can manage decisions

  const isCurrentPhaseReview = application.current_campaign_phases?.type === 'Review';
  const canSubmitReview = isReviewer && isCurrentPhaseReview && reviewerAssignment?.status === 'accepted';

  const isCurrentPhaseDecision = application.current_campaign_phases?.type === 'Decision';
  const canRecordDecision = isAdminOrRecruiter && isCurrentPhaseDecision;

  // Pre-process initialChecklistData to ensure it strictly conforms to ChecklistItemFormType
  const processedChecklistData: ChecklistItemFormType[] = (application.data?.screeningChecklist || []).map((item: any) => ({
    id: item.id,
    item: item.item,
    checked: item.checked ?? false,
    notes: item.notes ?? null,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
          <Link href="/workbench/applications/screening">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Screening
          </Link>
        </Button>
        <div className="flex space-x-2">
          {canSubmitReview && (
            <Button onClick={() => setIsReviewFormOpen(true)} className="rounded-full px-6 py-3 text-label-large">
              {currentReview ? <><Edit className="mr-2 h-5 w-5" /> Edit Review</> : <><Award className="mr-2 h-5 w-5" /> Submit Review</>}
            </Button>
          )}
          {canRecordDecision && (
            <Button onClick={() => { setEditingDecision(undefined); setIsDecisionFormOpen(true); }} className="rounded-full px-6 py-3 text-label-large">
              <PlusCircle className="mr-2 h-5 w-5" /> Record Decision
            </Button>
          )}
        </div>
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
          initialChecklistData={processedChecklistData}
          canModify={isAdminOrRecruiter}
          onChecklistUpdated={fetchApplicationDetails}
        />

        {/* Collaborative Notes */}
        <CollaborativeNotes
          applicationId={application.id}
          canAddNotes={canAddNotes}
          onNotesUpdated={fetchApplicationDetails}
        />
      </div>

      {/* Application Decisions Section */}
      <DecisionList
        applicationId={application.id}
        canModifyDecisions={canModifyDecisions}
        onDecisionModified={fetchApplicationDetails}
        onEditDecision={handleEditDecision}
      />

      {/* Workflow Participation Section */}
      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-headline-large font-bold text-foreground">Workflow Participation</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            Overview of applicant's progress across all campaign phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {application.campaign_id && (
            <WorkflowParticipation
              campaignId={application.campaign_id}
              currentCampaignPhaseId={application.current_campaign_phase_id}
              applicationOverallStatus={application.status}
            />
          )}
        </CardContent>
      </Card>

      {/* Review Form Dialog */}
      {application.current_campaign_phase_id && (
        <Dialog open={isReviewFormOpen} onOpenChange={setIsReviewFormOpen}>
          <DialogContent className="sm:max-w-[800px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-headline-small">
                {currentReview ? "Edit Your Review" : "Submit Your Review"}
              </DialogTitle>
            </DialogHeader>
            <ReviewForm
              applicationId={application.id}
              campaignPhaseId={application.current_campaign_phase_id}
              initialReview={currentReview}
              onReviewSaved={handleReviewSaved}
              onCancel={() => setIsReviewFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Decision Form Dialog */}
      {application.current_campaign_phase_id && user && (
        <Dialog open={isDecisionFormOpen} onOpenChange={setIsDecisionFormOpen}>
          <DialogContent className="sm:max-w-[800px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-headline-small">
                {editingDecision ? "Edit Decision" : "Record New Decision"}
              </DialogTitle>
            </DialogHeader>
            <DecisionForm
              applicationId={application.id}
              campaignPhaseId={application.current_campaign_phases?.id || application.current_campaign_phase_id}
              deciderId={user.id}
              initialDecision={editingDecision}
              onDecisionSaved={handleDecisionSaved}
              onCancel={() => setIsDecisionFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}