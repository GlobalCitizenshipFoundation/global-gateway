"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription, // Imported FormDescription
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle2, PlusCircle, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ReviewerAssignment } from "@/features/evaluations/services/evaluation-service";
import { getReviewerAssignmentsAction, createReviewerAssignmentAction, deleteReviewerAssignmentAction } from "@/features/evaluations/actions";
import { getCampaignPhasesAction } from "@/features/campaigns/actions"; // To get campaign phases
import { CampaignPhase } from "@/features/campaigns/services/campaign-service";

const assignReviewerSchema = z.object({
  reviewerId: z.string().uuid("Please select a valid reviewer."),
  campaignPhaseId: z.string().uuid("Please select a valid campaign phase."),
});

interface ReviewerAssignmentPanelProps {
  applicationId: string;
  campaignId: string; // Needed to fetch campaign phases
  canModifyAssignments: boolean; // Only campaign creator/admin can modify assignments
  onAssignmentsUpdated: () => void; // Callback to refresh parent data if needed
}

export function ReviewerAssignmentPanel({
  applicationId,
  campaignId,
  canModifyAssignments,
  onAssignmentsUpdated,
}: ReviewerAssignmentPanelProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const [assignments, setAssignments] = useState<ReviewerAssignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [campaignPhases, setCampaignPhases] = useState<CampaignPhase[]>([]);
  const [isLoadingPhases, setIsLoadingPhases] = useState(true);

  const form = useForm<z.infer<typeof assignReviewerSchema>>({
    resolver: zodResolver(assignReviewerSchema),
    defaultValues: {
      reviewerId: "",
      campaignPhaseId: "",
    },
  });

  const fetchAssignmentsAndPhases = async () => {
    setIsLoadingAssignments(true);
    setIsLoadingPhases(true);
    try {
      const fetchedAssignments = await getReviewerAssignmentsAction(undefined, undefined);
      if (fetchedAssignments) {
        setAssignments(fetchedAssignments.filter(a => a.application_id === applicationId));
      }

      const fetchedPhases = await getCampaignPhasesAction(campaignId);
      if (fetchedPhases) {
        // Filter for 'Review' type phases
        setCampaignPhases(fetchedPhases.filter(p => p.type === 'Review'));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load reviewer assignments or campaign phases.");
    } finally {
      setIsLoadingAssignments(false);
      setIsLoadingPhases(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchAssignmentsAndPhases();
    }
  }, [user, isSessionLoading, applicationId, campaignId]);

  const onSubmit = async (values: z.infer<typeof assignReviewerSchema>) => {
    if (!canModifyAssignments) {
      toast.error("You do not have permission to assign reviewers.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("application_id", applicationId);
      formData.append("reviewer_id", values.reviewerId);
      formData.append("campaign_phase_id", values.campaignPhaseId);

      const result = await createReviewerAssignmentAction(formData);
      if (result) {
        toast.success("Reviewer assigned successfully!");
        form.reset({ reviewerId: "", campaignPhaseId: "" });
        fetchAssignmentsAndPhases();
        onAssignmentsUpdated();
      }
    } catch (error: any) {
      console.error("Reviewer assignment error:", error);
      toast.error(error.message || "Failed to assign reviewer.");
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const success = await deleteReviewerAssignmentAction(assignmentId);
      if (success) {
        toast.success("Reviewer assignment removed successfully!");
        fetchAssignmentsAndPhases();
        onAssignmentsUpdated();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove assignment.");
    }
  };

  const getAssignmentStatusIcon = (status: ReviewerAssignment['status']) => {
    switch (status) {
      case "assigned": return <Clock className="h-4 w-4 text-blue-600" />;
      case "accepted": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "declined": return <XCircle className="h-4 w-4 text-red-600" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAssignmentStatusColor = (status: ReviewerAssignment['status']) => {
    switch (status) {
      case "assigned": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "accepted": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "declined": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "completed": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };

  const getUserInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  // Placeholder for fetching actual users with 'reviewer' role.
  // In a real app, this would be a more sophisticated user search/selection.
  const availableReviewers = [
    { id: "reviewer_1", name: "Dr. Jane Doe" },
    { id: "reviewer_2", name: "Prof. John Smith" },
    { id: "reviewer_3", name: "Ms. Emily White" },
  ];

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small font-bold text-foreground">Reviewer Assignments</CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          Manage who is assigned to review this application for each phase.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {isLoadingAssignments || isLoadingPhases ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {assignments.length === 0 ? (
              <p className="text-body-medium text-muted-foreground text-center">No reviewers assigned yet.</p>
            ) : (
              assignments.map((assignment) => {
                const reviewerName = `${assignment.profiles?.first_name || ''} ${assignment.profiles?.last_name || ''}`.trim() || "Unknown Reviewer";
                const phaseName = assignment.campaign_phases?.name || "Unknown Phase";

                return (
                  <div key={assignment.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={assignment.profiles?.avatar_url || ""} alt={reviewerName} />
                      <AvatarFallback className="bg-tertiary-container text-on-tertiary-container text-label-small">
                        {getUserInitials(assignment.profiles?.first_name, assignment.profiles?.last_name) || <UserCircle2 className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-label-large font-medium text-foreground">
                          {reviewerName}
                        </p>
                        <span className="text-body-small text-muted-foreground">
                          Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-body-medium text-muted-foreground">
                        Phase: <span className="font-medium text-foreground">{phaseName}</span>
                      </p>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit mt-2 ${getAssignmentStatusColor(assignment.status)}`}>
                        {getAssignmentStatusIcon(assignment.status)}
                        <span className="font-medium text-body-small capitalize">Status: {assignment.status}</span>
                      </div>
                      {canModifyAssignments && (
                        <div className="flex justify-end space-x-2 mt-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove Assignment</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-headline-small">Confirm Removal</AlertDialogTitle>
                                <AlertDialogDescription className="text-body-medium text-muted-foreground">
                                  Are you sure you want to remove this assignment for &quot;{reviewerName}&quot; in phase &quot;{phaseName}&quot;?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                  className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {canModifyAssignments && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-title-large font-bold text-foreground mb-4">Assign New Reviewer</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="reviewerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Reviewer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={form.formState.isSubmitting || isLoadingPhases}>
                        <FormControl>
                          <SelectTrigger className="rounded-md">
                            <SelectValue placeholder="Select a reviewer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                          {availableReviewers.length === 0 ? (
                            <SelectItem value="no-reviewers" disabled className="text-body-medium text-muted-foreground">
                              No reviewers available.
                            </SelectItem>
                          ) : (
                            availableReviewers.map((reviewer) => (
                              <SelectItem key={reviewer.id} value={reviewer.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                {reviewer.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="campaignPhaseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Campaign Phase</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={form.formState.isSubmitting || isLoadingPhases}>
                        <FormControl>
                          <SelectTrigger className="rounded-md">
                            <SelectValue placeholder="Select a review phase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                          {campaignPhases.length === 0 ? (
                            <SelectItem value="no-phases" disabled className="text-body-medium text-muted-foreground">
                              No review phases available.
                            </SelectItem>
                          ) : (
                            campaignPhases.map((phase) => (
                              <SelectItem key={phase.id} value={phase.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                {phase.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-body-small">
                        Assign the reviewer to a specific 'Review' type phase.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting || isLoadingPhases}>
                  {form.formState.isSubmitting ? "Assigning..." : "Assign Reviewer"}
                  <PlusCircle className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}