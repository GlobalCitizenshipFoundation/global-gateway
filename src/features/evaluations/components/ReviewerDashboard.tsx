"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle2, Briefcase, Workflow, CalendarDays, CheckCircle, XCircle, Clock, FileText, Award, Edit, Eye } from "lucide-react";
import { ReviewerAssignment, Review } from "../services/evaluation-service";
import { getReviewerAssignmentsAction, getReviewsAction, updateReviewerAssignmentAction } from "../actions";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function ReviewerDashboard() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [assignments, setAssignments] = useState<ReviewerAssignment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>("all");

  const fetchReviewerData = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        toast.error("User not authenticated.");
        return;
      }

      const fetchedAssignments = await getReviewerAssignmentsAction(undefined, user.id);
      if (fetchedAssignments) {
        setAssignments(fetchedAssignments);
      }

      const fetchedReviews = await getReviewsAction(undefined, user.id);
      if (fetchedReviews) {
        setReviews(fetchedReviews);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load reviewer data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchReviewerData();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view this dashboard.");
      setIsLoading(false);
    }
  }, [user, isSessionLoading]);

  const handleUpdateAssignmentStatus = async (assignmentId: string, newStatus: ReviewerAssignment['status']) => {
    try {
      const formData = new FormData();
      formData.append("status", newStatus);
      if (newStatus === 'completed') {
        formData.append("completed_at", new Date().toISOString());
      } else {
        formData.append("completed_at", ""); // Clear completed_at if not completed
      }

      const updatedAssignment = await updateReviewerAssignmentAction(assignmentId, formData);
      if (updatedAssignment) {
        toast.success(`Assignment status updated to ${newStatus}.`);
        fetchReviewerData(); // Re-fetch to update lists
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update assignment status.");
    }
  };

  const getAssignmentStatusIcon = (status: ReviewerAssignment['status']) => {
    switch (status) {
      case "assigned": return <Clock className="h-4 w-4 text-blue-600" />;
      case "accepted": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "declined": return <XCircle className="h-4 w-4 text-red-600" />;
      case "completed": return <Award className="h-4 w-4 text-purple-600" />;
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

  const getReviewStatusIcon = (status: Review['status']) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "submitted": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "reopened": return <Edit className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getReviewStatusColor = (status: Review['status']) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "submitted": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "reopened": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === "" ||
      assignment.applications?.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.applications?.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.applications?.campaigns?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.campaign_phases?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = assignmentStatusFilter === "all" || assignment.status === assignmentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === "" ||
      review.applications?.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.applications?.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.applications?.campaigns?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.campaign_phases?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = reviewStatusFilter === "all" || review.status === reviewStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-xl shadow-md p-6"><Skeleton className="h-48 w-full" /></Card>
          <Card className="rounded-xl shadow-md p-6"><Skeleton className="h-48 w-full" /></Card>
        </div>
      </div>
    );
  }

  const userRole: string = user?.user_metadata?.role || '';
  const isReviewer = ['reviewer', 'admin', 'coordinator', 'evaluator', 'screener'].includes(userRole);

  if (!isReviewer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <h1 className="text-display-medium mb-4">Access Denied</h1>
        <p className="text-headline-small text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-display-small font-bold text-foreground">Reviewer Dashboard</h1>
      <p className="text-headline-small text-muted-foreground">Welcome, {user?.user_metadata?.first_name || user?.email}!</p>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by applicant, campaign, or phase..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow rounded-md"
        />
        <Select value={assignmentStatusFilter} onValueChange={setAssignmentStatusFilter}>
          <SelectTrigger className="w-[180px] rounded-md">
            <SelectValue placeholder="Filter Assignments" />
          </SelectTrigger>
          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <SelectItem value="all" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">All Assignments</SelectItem>
            <SelectItem value="assigned" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Assigned</SelectItem>
            <SelectItem value="accepted" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Accepted</SelectItem>
            <SelectItem value="declined" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Declined</SelectItem>
            <SelectItem value="completed" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={reviewStatusFilter} onValueChange={setReviewStatusFilter}>
          <SelectTrigger className="w-[180px] rounded-md">
            <SelectValue placeholder="Filter Reviews" />
          </SelectTrigger>
          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <SelectItem value="all" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">All Reviews</SelectItem>
            <SelectItem value="pending" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Pending</SelectItem>
            <SelectItem value="submitted" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Submitted</SelectItem>
            <SelectItem value="reopened" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Reopened</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Assignments */}
        <Card className="rounded-xl shadow-lg p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-headline-large font-bold text-foreground">My Assignments</CardTitle>
            <CardDescription className="text-body-medium text-muted-foreground">
              Applications assigned to you for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {filteredAssignments.length === 0 ? (
              <p className="text-body-medium text-muted-foreground text-center">No assignments found.</p>
            ) : (
              filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className="rounded-lg border p-4 flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={assignment.applications?.profiles?.avatar_url || ""} alt={`${assignment.applications?.profiles?.first_name} ${assignment.applications?.profiles?.last_name}`} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-label-medium">
                      {assignment.applications?.profiles?.first_name?.charAt(0) || ""}{assignment.applications?.profiles?.last_name?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="text-title-medium font-medium text-foreground">
                      {assignment.applications?.profiles?.first_name} {assignment.applications?.profiles?.last_name}
                    </p>
                    <p className="text-body-small text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {assignment.applications?.campaigns?.name || "N/A Campaign"}
                    </p>
                    <p className="text-body-small text-muted-foreground flex items-center gap-1">
                      <Workflow className="h-3 w-3" /> {assignment.campaign_phases?.name || "N/A Phase"}
                    </p>
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full w-fit mt-1", getAssignmentStatusColor(assignment.status))}>
                      {getAssignmentStatusIcon(assignment.status)}
                      <span className="font-medium text-body-small capitalize">{assignment.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button asChild variant="outlined" size="sm" className="rounded-md text-label-small">
                      <Link href={`/applications/${assignment.application_id}`}> {/* Corrected link */}
                        <Eye className="mr-1 h-3 w-3" /> View App
                      </Link>
                    </Button>
                    {assignment.status === 'assigned' && (
                      <Button variant="filled" size="sm" className="rounded-md text-label-small" onClick={() => handleUpdateAssignmentStatus(assignment.id, 'accepted')}>
                        <CheckCircle className="mr-1 h-3 w-3" /> Accept
                      </Button>
                    )}
                    {assignment.status === 'accepted' && (
                      <Button variant="tonal" size="sm" className="rounded-md text-label-small" onClick={() => handleUpdateAssignmentStatus(assignment.id, 'completed')}>
                        <Award className="mr-1 h-3 w-3" /> Complete
                      </Button>
                    )}
                    {assignment.status === 'assigned' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="rounded-md text-label-small">
                            <XCircle className="mr-1 h-3 w-3" /> Decline
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-headline-small">Confirm Decline</AlertDialogTitle>
                            <AlertDialogDescription className="text-body-medium text-muted-foreground">
                              Are you sure you want to decline this assignment? You may not be able to review this application later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUpdateAssignmentStatus(assignment.id, 'declined')}
                              className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Decline
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Reviews */}
        <Card className="rounded-xl shadow-lg p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-headline-large font-bold text-foreground">My Reviews</CardTitle>
            <CardDescription className="text-body-medium text-muted-foreground">
              Your submitted and pending reviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {filteredReviews.length === 0 ? (
              <p className="text-body-medium text-muted-foreground text-center">No reviews found.</p>
            ) : (
              filteredReviews.map((review) => (
                <Card key={review.id} className="rounded-lg border p-4 flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.applications?.profiles?.avatar_url || ""} alt={`${review.applications?.profiles?.first_name} ${review.applications?.profiles?.last_name}`} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-label-medium">
                      {review.applications?.profiles?.first_name?.charAt(0) || ""}{review.applications?.profiles?.last_name?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="text-title-medium font-medium text-foreground">
                      {review.applications?.profiles?.first_name} {review.applications?.profiles?.last_name}
                    </p>
                    <p className="text-body-small text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {review.applications?.campaigns?.name || "N/A Campaign"}
                    </p>
                    <p className="text-body-small text-muted-foreground flex items-center gap-1">
                      <Workflow className="h-3 w-3" /> {review.campaign_phases?.name || "N/A Phase"}
                    </p>
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full w-fit mt-1", getReviewStatusColor(review.status))}>
                      {getReviewStatusIcon(review.status)}
                      <span className="font-medium text-body-small capitalize">{review.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button asChild variant="outlined" size="sm" className="rounded-md text-label-small">
                      <Link href={`/applications/${review.application_id}`}> {/* Corrected link */}
                        <Eye className="mr-1 h-3 w-3" /> View App
                      </Link>
                    </Button>
                    {review.status !== 'submitted' && (
                      <Button variant="tonal" size="sm" className="rounded-md text-label-small">
                        <Edit className="mr-1 h-3 w-3" /> Start/Edit Review
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}