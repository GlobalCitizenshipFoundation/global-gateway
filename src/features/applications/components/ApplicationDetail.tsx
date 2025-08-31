"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserCircle2, Briefcase, Workflow, CalendarDays, CheckCircle, XCircle, Clock, FileText, Info, Award, Edit, PlusCircle, MailCheck } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Added DialogDescription, DialogFooter
import { ReviewForm } from "@/features/evaluations/components/ReviewForm";
import { getReviewsAction, getReviewerAssignmentsAction, getDecisionsAction } from "@/features/evaluations/actions";
import { Review, ReviewerAssignment, Decision } from "@/features/evaluations/services/evaluation-service";
import { DecisionForm } from "@/features/evaluations/components/DecisionForm";
import { DecisionList } from "@/features/evaluations/components/DecisionList";
import { ReviewerAssignmentPanel } from "./ReviewerAssignmentPanel";
import { RecommendationRequest } from "@/features/recommendations"; // Import RecommendationRequest from barrel file
import { getRecommendationRequestsAction, createRecommendationRequestAction, updateRecommendationRequestStatusAction } from "@/features/recommendations"; // Import recommendation actions from barrel file
import { getCampaignPhasesAction } from "@/features/campaigns/actions"; // To get phase config
import { CampaignPhase } from "@/features/campaigns/services/campaign-service";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form"; // Import useForm
import { zodResolver } from "@hookform/resolvers/zod"; // Import zodResolver
import * as z from "zod"; // Import zod
import { Input } from "@/components/ui/input"; // Import Input
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Import Form components

const createRecommendationRequestSchema = z.object({
  recommenderEmail: z.string().email("Invalid email address."),
  recommenderName: z.string().nullable().optional(),
});

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
  const [isDecisionFormOpen, setIsDecisionFormOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | undefined>(undefined);
  const [recommendationRequests, setRecommendationRequests] = useState<RecommendationRequest[]>([]); // State for recommendation requests
  const [isRecommendationRequestFormOpen, setIsRecommendationRequestFormOpen] = useState(false); // State for recommendation request form
  const [isLoadingRecommendationRequests, setIsLoadingRecommendationRequests] = useState(true);
  const [currentRecommendationPhase, setCurrentRecommendationPhase] = useState<CampaignPhase | null>(null); // Current recommendation phase config

  const recommendationForm = useForm<z.infer<typeof createRecommendationRequestSchema>>({
    resolver: zodResolver(createRecommendationRequestSchema),
    defaultValues: {
      recommenderEmail: "",
      recommenderName: "",
    },
  });

  const fetchApplicationDetails = async () => {
    setIsLoading(true);
    try {
      const fetchedApplication = await getApplicationByIdAction(applicationId);
      if (!fetchedApplication) {
        toast.error("Application not found or unauthorized.");
        router.push("/applications/screening");
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
          setCurrentReview(reviews?.[0]);
        }
      }

      // Fetch recommendation requests if in a recommendation phase
      if (fetchedApplication.current_campaign_phases?.type === 'Recommendation') {
        setIsLoadingRecommendationRequests(true);
        const fetchedRequests = await getRecommendationRequestsAction(applicationId);
        if (fetchedRequests) {
          setRecommendationRequests(fetchedRequests);
        }
        // Fetch the current recommendation phase config
        const campaignPhases = await getCampaignPhasesAction(fetchedApplication.campaigns?.id || "");
        const recPhase = campaignPhases?.find(p => p.id === fetchedApplication.current_campaign_phase_id);
        setCurrentRecommendationPhase(recPhase || null);
        setIsLoadingRecommendationRequests(false);
      } else {
        setRecommendationRequests([]);
        setCurrentRecommendationPhase(null);
        setIsLoadingRecommendationRequests(false);
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to load application details.");
      router.push("/applications/screening");
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
    fetchApplicationDetails();
  };

  const handleDecisionSaved = () => {
    setIsDecisionFormOpen(false);
    setEditingDecision(undefined);
    fetchApplicationDetails();
  };

  const handleEditDecision = (decision: Decision) => {
    setEditingDecision(decision);
    setIsDecisionFormOpen(true);
  };

  const handleRecommendationRequestSaved = () => {
    setIsRecommendationRequestFormOpen(false);
    recommendationForm.reset(); // Reset form after saving
    fetchApplicationDetails();
  };

  const handleSendReminder = async (requestId: string) => {
    try {
      // In a real app, this would trigger an email sending service
      await updateRecommendationRequestStatusAction(requestId, 'sent'); // Mark as sent again
      toast.success("Reminder sent successfully!");
      fetchApplicationDetails();
    } catch (error: any) {
      toast.error(error.message || "Failed to send reminder.");
    }
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
  const isReviewer = ['reviewer', 'admin', 'coordinator', 'evaluator'].includes(userRole);
  const canModifyApplication: boolean = isAdminOrRecruiter || application.applicant_id === user?.id;
  const canAddNotes: boolean = isAdminOrRecruiter;
  const canModifyDecisions: boolean = isAdminOrRecruiter;
  const canModifyAssignments: boolean = isAdminOrRecruiter;
  const canManageRecommendations: boolean = isAdminOrRecruiter; // Only admin/campaign creator can manage recommendations

  const isCurrentPhaseReview = application.current_campaign_phases?.type === 'Review';
  const canSubmitReview = isReviewer && isCurrentPhaseReview && reviewerAssignment?.status === 'accepted';

  const isCurrentPhaseDecision = application.current_campaign_phases?.type === 'Decision';
  const canRecordDecision = isAdminOrRecruiter && isCurrentPhaseDecision;

  const isCurrentPhaseRecommendation = application.current_campaign_phases?.type === 'Recommendation';
  const canRequestRecommendation = canManageRecommendations && isCurrentPhaseRecommendation;

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
          <Link href="/applications/screening">
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
          {canRequestRecommendation && (
            <Button onClick={() => setIsRecommendationRequestFormOpen(true)} className="rounded-full px-6 py-3 text-label-large">
              <PlusCircle className="mr-2 h-5 w-5" /> Request Recommendation
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

      {/* Reviewer Assignment Panel */}
      {application.campaigns?.id && (
        <ReviewerAssignmentPanel
          applicationId={application.id}
          campaignId={application.campaigns.id}
          canModifyAssignments={canModifyAssignments}
          onAssignmentsUpdated={fetchApplicationDetails}
        />
      )}

      {/* Recommendation Requests Section */}
      {isCurrentPhaseRecommendation && (
        <Card className="rounded-xl shadow-lg p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-headline-large font-bold text-foreground">Recommendation Requests</CardTitle>
            <CardDescription className="text-body-medium text-muted-foreground">
              Manage requests sent to recommenders for this application.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {isLoadingRecommendationRequests ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : recommendationRequests.length === 0 ? (
              <p className="text-body-medium text-muted-foreground text-center">No recommendation requests sent yet.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {recommendationRequests.map((req) => (
                  <Card key={req.id} className="rounded-lg border p-4 flex items-center justify-between">
                    <div>
                      <p className="text-title-medium font-medium text-foreground">
                        {req.recommender_name || req.recommender_email}
                      </p>
                      <p className="text-body-medium text-muted-foreground">
                        Email: {req.recommender_email}
                      </p>
                      <p className="text-body-small text-muted-foreground mt-1">
                        Status: <span className="font-medium capitalize">{req.status}</span>
                      </p>
                      {req.request_sent_at && (
                        <p className="text-body-small text-muted-foreground">
                          Sent: {format(parseISO(req.request_sent_at), "PPP")}
                        </p>
                      )}
                      {req.submitted_at && (
                        <p className="text-body-small text-muted-foreground">
                          Submitted: {format(parseISO(req.submitted_at), "PPP")}
                        </p>
                      )}
                    </div>
                    {canManageRecommendations && req.status !== 'submitted' && (
                      <Button variant="tonal" size="sm" className="rounded-md text-label-small" onClick={() => handleSendReminder(req.id)}>
                        <MailCheck className="mr-1 h-3 w-3" /> Send Reminder
                      </Button>
                    )}
                    {canManageRecommendations && req.status === 'submitted' && (
                      <Button variant="outlined" size="sm" className="rounded-md text-label-small" asChild>
                        <Link href={`/recommendation/${req.unique_token}`} target="_blank">
                          <FileText className="mr-1 h-3 w-3" /> View Submission
                        </Link>
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              campaignId={application.campaigns.id}
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

      {/* Recommendation Request Form Dialog */}
      {isRecommendationRequestFormOpen && application.current_campaign_phase_id && (
        <Dialog open={isRecommendationRequestFormOpen} onOpenChange={setIsRecommendationRequestFormOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-xl shadow-lg bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-headline-small">Request Recommendation</DialogTitle>
              <DialogDescription className="text-body-medium text-muted-foreground">
                Send a request to a recommender for this application.
              </DialogDescription>
            </DialogHeader>
            <Form {...recommendationForm}>
              <form onSubmit={recommendationForm.handleSubmit(async (values) => {
                  try {
                    const formData = new FormData();
                    formData.append("recommender_email", values.recommenderEmail);
                    formData.append("recommender_name", values.recommenderName || "");
                    formData.append("campaign_phase_id", application.current_campaign_phase_id || ""); // Pass campaign_phase_id
                    const result = await createRecommendationRequestAction(application.id, formData);
                    if (result) {
                      toast.success("Recommendation request sent successfully!");
                      handleRecommendationRequestSaved();
                    }
                  } catch (error: any) {
                    toast.error(error.message || "Failed to send recommendation request.");
                  }
                })} className="grid gap-4 py-4">
                  <FormField
                    control={recommendationForm.control}
                    name="recommenderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-label-large">Recommender Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Dr. Jane Doe" {...field} className="rounded-md" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={recommendationForm.control}
                    name="recommenderEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-label-large">Recommender Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="recommender@example.com" {...field} className="rounded-md" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outlined" onClick={() => setIsRecommendationRequestFormOpen(false)} className="rounded-md text-label-large">
                      Cancel
                    </Button>
                    <Button type="submit" className="rounded-md text-label-large" disabled={recommendationForm.formState.isSubmitting}>
                      {recommendationForm.formState.isSubmitting ? "Sending..." : "Send Request"}
                    </Button>
                  </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}